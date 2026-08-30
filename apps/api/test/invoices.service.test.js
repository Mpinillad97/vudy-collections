'use strict';

// Unit tests for InvoicesService. PrismaService is a hand-rolled fake —
// no real database. Runs against the compiled output (`npm run build`
// first) using Node's built-in test runner, matching the pattern from
// M1.2/M1.3/M2.1.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { InvoicesService } = require('../dist/invoices/invoices.service');
const {
  InvoiceCustomerNotFoundError,
  InvoiceNotFoundError,
  InvoicePaymentRequestAlreadyExistsError,
  InvoicePersistenceError,
  InvoiceQueryError,
} = require('../dist/invoices/invoices.exceptions');
const { VudyConfigurationError, VudyUpstreamError } = require('../dist/vudy/vudy.exceptions');
const { PaymentRequestPersistenceError } = require('../dist/payment-requests/payment-requests.exceptions');
const { Prisma } = require('@prisma/client');

// create/findById/findAll never talk to Vudy — this stub fails loudly if
// they ever do.
const vudyServiceThatMustNotBeCalled = {
  createPaymentRequest: async () => {
    throw new Error('VudyService.createPaymentRequest must not be called here');
  },
};

const DTO = {
  customerId: 'cust_1',
  number: 'INV-001',
  amount: 100,
  currency: 'USD',
  dueDate: '2026-09-15',
};

const ORIGINAL_TARGET_ADDRESS = process.env.VUDY_TARGET_ADDRESS;

async function withTargetAddress(value, fn) {
  if (value === undefined) {
    delete process.env.VUDY_TARGET_ADDRESS;
  } else {
    process.env.VUDY_TARGET_ADDRESS = value;
  }
  try {
    await fn();
  } finally {
    if (ORIGINAL_TARGET_ADDRESS === undefined) {
      delete process.env.VUDY_TARGET_ADDRESS;
    } else {
      process.env.VUDY_TARGET_ADDRESS = ORIGINAL_TARGET_ADDRESS;
    }
  }
}

// --- create -----------------------------------------------------------

test('create verifies the customer exists, then persists and returns the invoice', async () => {
  let customerFindArgs;
  let invoiceCreateArgs;
  const createdInvoice = {
    id: 'inv_1',
    customerId: 'cust_1',
    number: 'INV-001',
    amount: '100',
    currency: 'USD',
    dueDate: new Date('2026-09-15T00:00:00.000Z'),
    createdAt: new Date(),
  };
  const fakePrisma = {
    customer: {
      findUnique: async (args) => {
        customerFindArgs = args;
        return { id: 'cust_1' };
      },
    },
    invoice: {
      create: async (args) => {
        invoiceCreateArgs = args;
        return createdInvoice;
      },
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);
  const result = await service.create(DTO);

  assert.deepEqual(result, createdInvoice);
  assert.deepEqual(customerFindArgs, { where: { id: 'cust_1' }, select: { id: true } });
  // Only the documented fields are forwarded to Prisma — nothing else leaks through.
  assert.deepEqual(invoiceCreateArgs, {
    data: {
      customerId: 'cust_1',
      number: 'INV-001',
      amount: 100,
      currency: 'USD',
      dueDate: new Date('2026-09-15'),
    },
  });
});

test('create throws InvoiceCustomerNotFoundError and never inserts when the customer does not exist', async () => {
  let invoiceCreateCalled = false;
  const fakePrisma = {
    customer: {
      findUnique: async () => null,
    },
    invoice: {
      create: async () => {
        invoiceCreateCalled = true;
      },
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);

  await assert.rejects(
    () => service.create(DTO),
    (err) => {
      assert.ok(err instanceof InvoiceCustomerNotFoundError);
      assert.equal(err.getStatus(), 404);
      assert.match(err.message, /cust_1/);
      return true;
    },
  );
  assert.equal(invoiceCreateCalled, false, 'an invoice must never be created for a missing customer');
});

test('create wraps a Prisma failure during the insert in a controlled error', async () => {
  const fakePrisma = {
    customer: {
      findUnique: async () => ({ id: 'cust_1' }),
    },
    invoice: {
      create: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);

  await assert.rejects(
    () => service.create(DTO),
    (err) => {
      assert.ok(err instanceof InvoicePersistenceError);
      assert.equal(err.getStatus(), 500);
      assert.doesNotMatch(JSON.stringify(err.getResponse()), /internal-db-host/);
      return true;
    },
  );
});

test('create wraps a Prisma failure during the customer existence check in a controlled error', async () => {
  let invoiceCreateCalled = false;
  const fakePrisma = {
    customer: {
      findUnique: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
    invoice: {
      create: async () => {
        invoiceCreateCalled = true;
      },
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);

  await assert.rejects(
    () => service.create(DTO),
    (err) => {
      assert.ok(err instanceof InvoiceQueryError);
      assert.equal(err.getStatus(), 500);
      assert.doesNotMatch(JSON.stringify(err.getResponse()), /internal-db-host/);
      return true;
    },
  );
  assert.equal(invoiceCreateCalled, false);
});

// --- findById -----------------------------------------------------------

test('findById returns the persisted record, including its associated payment request, when it exists', async () => {
  const stored = {
    id: 'inv_1',
    customerId: 'cust_1',
    number: 'INV-001',
    amount: '100',
    currency: 'USD',
    dueDate: new Date('2026-09-15'),
    createdAt: new Date(),
    paymentRequest: { id: 'pr_1', vudyRequestId: 'req_abc123' },
  };
  let queryArgs;
  const fakePrisma = {
    invoice: {
      findUnique: async (args) => {
        queryArgs = args;
        return stored;
      },
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);
  const result = await service.findById('inv_1');

  assert.deepEqual(result, stored);
  assert.deepEqual(queryArgs, { where: { id: 'inv_1' }, include: { paymentRequest: true } });
});

test('findById throws a 404 InvoiceNotFoundError when no record matches', async () => {
  const fakePrisma = {
    invoice: {
      findUnique: async () => null,
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);

  await assert.rejects(
    () => service.findById('does-not-exist'),
    (err) => {
      assert.ok(err instanceof InvoiceNotFoundError);
      assert.equal(err.getStatus(), 404);
      assert.match(err.message, /does-not-exist/);
      return true;
    },
  );
});

test('findById converts a Prisma failure into a controlled error without leaking details', async () => {
  const fakePrisma = {
    invoice: {
      findUnique: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);

  await assert.rejects(
    () => service.findById('inv_1'),
    (err) => {
      assert.ok(err instanceof InvoiceQueryError);
      assert.equal(err.getStatus(), 500);
      assert.doesNotMatch(err.message, /internal-db-host/);
      assert.doesNotMatch(JSON.stringify(err.getResponse()), /internal-db-host/);
      return true;
    },
  );
});

// --- findAll --------------------------------------------------------------

test('findAll returns the persisted records ordered by most recent first', async () => {
  const records = [
    { id: 'inv_2', customerId: 'cust_1', createdAt: new Date('2026-01-02') },
    { id: 'inv_1', customerId: 'cust_1', createdAt: new Date('2026-01-01') },
  ];
  let findManyArgs;
  const fakePrisma = {
    invoice: {
      findMany: async (args) => {
        findManyArgs = args;
        return records;
      },
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);
  const result = await service.findAll();

  assert.deepEqual(result, records);
  assert.deepEqual(findManyArgs, { orderBy: { createdAt: 'desc' } });
});

test('findAll returns an empty array when there are no records, without throwing', async () => {
  const fakePrisma = {
    invoice: {
      findMany: async () => [],
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);
  const result = await service.findAll();

  assert.deepEqual(result, []);
});

test('findAll converts a Prisma failure into a controlled error without leaking details', async () => {
  const fakePrisma = {
    invoice: {
      findMany: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
  };

  const service = new InvoicesService(fakePrisma, vudyServiceThatMustNotBeCalled);

  await assert.rejects(
    () => service.findAll(),
    (err) => {
      assert.ok(err instanceof InvoiceQueryError);
      assert.equal(err.getStatus(), 500);
      assert.doesNotMatch(err.message, /internal-db-host/);
      assert.doesNotMatch(JSON.stringify(err.getResponse()), /internal-db-host/);
      return true;
    },
  );
});

// --- createPaymentRequest --------------------------------------------------

const PR_DTO = { requestedChain: 'ethereum', requestedToken: 'USDC' };

function invoiceWithNoPaymentRequest(overrides = {}) {
  return {
    id: 'inv_1',
    customerId: 'cust_1',
    number: 'INV-001',
    amount: new Prisma.Decimal('250.75'),
    currency: 'USD',
    dueDate: new Date('2026-09-15'),
    createdAt: new Date(),
    paymentRequest: null,
    ...overrides,
  };
}

test('createPaymentRequest uses Invoice.amount/currency, calls Vudy, and persists the link (1: happy path, 2: amount, 7: mapping)', async () => {
  await withTargetAddress('0xTARGET', async () => {
    const invoice = invoiceWithNoPaymentRequest();
    let vudyCallArgs;
    const fakeVudy = {
      createPaymentRequest: async (input) => {
        vudyCallArgs = input;
        return {
          id: 'req_abc123',
          url: 'https://vudy.app/request/tx_xyz789',
          embedUrl: 'https://vudy.app/embed/request/tx_xyz789',
        };
      },
    };
    let prismaCreateArgs;
    const fakePrisma = {
      invoice: {
        findUnique: async () => invoice,
      },
      paymentRequest: {
        create: async (args) => {
          prismaCreateArgs = args;
          return { id: 'pr_1', invoiceId: 'inv_1', vudyRequestId: 'req_abc123' };
        },
      },
    };

    const service = new InvoicesService(fakePrisma, fakeVudy);
    const result = await service.createPaymentRequest('inv_1', PR_DTO);

    assert.deepEqual(result, { id: 'pr_1', invoiceId: 'inv_1', vudyRequestId: 'req_abc123' });

    // (2) amount sent to Vudy is exactly Invoice.amount, converted from Decimal.
    assert.equal(vudyCallArgs.amount, 250.75);
    assert.equal(vudyCallArgs.targetAddress, '0xTARGET');
    assert.deepEqual(vudyCallArgs.channelParams, {
      currencyToken: 'USD',
      requestedChain: 'ethereum',
      requestedToken: 'USDC',
    });

    // (7) Invoice -> Vudy response -> PaymentRequest mapping.
    assert.equal(prismaCreateArgs.data.vudyRequestId, 'req_abc123');
    assert.equal(prismaCreateArgs.data.vudyUrl, 'https://vudy.app/request/tx_xyz789');
    assert.equal(prismaCreateArgs.data.vudyEmbedUrl, 'https://vudy.app/embed/request/tx_xyz789');
    assert.equal(prismaCreateArgs.data.targetAddress, '0xTARGET');
    assert.equal(prismaCreateArgs.data.amount, invoice.amount);
    assert.equal(prismaCreateArgs.data.currencyToken, 'USD');
    assert.equal(prismaCreateArgs.data.requestedChain, 'ethereum');
    assert.equal(prismaCreateArgs.data.requestedToken, 'USDC');
    assert.equal(prismaCreateArgs.data.invoiceId, 'inv_1');
  });
});

test('createPaymentRequest ignores a spurious amount injected into the dto (8: cannot override Invoice.amount)', async () => {
  await withTargetAddress('0xTARGET', async () => {
    const invoice = invoiceWithNoPaymentRequest();
    let vudyCallArgs;
    const fakeVudy = {
      createPaymentRequest: async (input) => {
        vudyCallArgs = input;
        return { id: 'req_x', url: 'https://vudy.app/x', embedUrl: 'https://vudy.app/embed/x' };
      },
    };
    const fakePrisma = {
      invoice: { findUnique: async () => invoice },
      paymentRequest: { create: async () => ({ id: 'pr_1' }) },
    };

    const service = new InvoicesService(fakePrisma, fakeVudy);
    // Simulates a caller injecting an extra "amount" field the DTO type doesn't declare.
    await service.createPaymentRequest('inv_1', { ...PR_DTO, amount: 999999 });

    assert.equal(vudyCallArgs.amount, 250.75, 'the client-supplied amount must never reach Vudy');
  });
});

test('createPaymentRequest returns 404 and never calls Vudy when the invoice does not exist (3)', async () => {
  await withTargetAddress('0xTARGET', async () => {
    let vudyCalled = false;
    const fakeVudy = { createPaymentRequest: async () => { vudyCalled = true; } };
    const fakePrisma = { invoice: { findUnique: async () => null } };

    const service = new InvoicesService(fakePrisma, fakeVudy);

    await assert.rejects(
      () => service.createPaymentRequest('does-not-exist', PR_DTO),
      (err) => {
        assert.ok(err instanceof InvoiceNotFoundError);
        assert.equal(err.getStatus(), 404);
        return true;
      },
    );
    assert.equal(vudyCalled, false);
  });
});

test('createPaymentRequest returns 409 and never calls Vudy when the invoice already has a payment request (4)', async () => {
  await withTargetAddress('0xTARGET', async () => {
    let vudyCalled = false;
    const fakeVudy = { createPaymentRequest: async () => { vudyCalled = true; } };
    const invoice = invoiceWithNoPaymentRequest({
      paymentRequest: { id: 'pr_existing', vudyRequestId: 'req_existing' },
    });
    let prismaCreateCalled = false;
    const fakePrisma = {
      invoice: { findUnique: async () => invoice },
      paymentRequest: { create: async () => { prismaCreateCalled = true; } },
    };

    const service = new InvoicesService(fakePrisma, fakeVudy);

    await assert.rejects(
      () => service.createPaymentRequest('inv_1', PR_DTO),
      (err) => {
        assert.ok(err instanceof InvoicePaymentRequestAlreadyExistsError);
        assert.equal(err.getStatus(), 409);
        assert.match(err.message, /pr_existing/);
        return true;
      },
    );
    assert.equal(vudyCalled, false, 'this is a local duplication guard — Vudy must never be called');
    assert.equal(prismaCreateCalled, false);
  });
});

test('createPaymentRequest does not persist anything when Vudy fails (5)', async () => {
  await withTargetAddress('0xTARGET', async () => {
    const invoice = invoiceWithNoPaymentRequest();
    const fakeVudy = {
      createPaymentRequest: async () => {
        throw new VudyUpstreamError(403, 'SERVER_VALIDATION_API_AUTH_02', 'Invalid API key format');
      },
    };
    let prismaCreateCalled = false;
    const fakePrisma = {
      invoice: { findUnique: async () => invoice },
      paymentRequest: { create: async () => { prismaCreateCalled = true; } },
    };

    const service = new InvoicesService(fakePrisma, fakeVudy);

    await assert.rejects(() => service.createPaymentRequest('inv_1', PR_DTO), VudyUpstreamError);
    assert.equal(prismaCreateCalled, false);
  });
});

test('createPaymentRequest wraps a persistence failure after Vudy succeeds, including vudyRequestId (6)', async () => {
  await withTargetAddress('0xTARGET', async () => {
    const invoice = invoiceWithNoPaymentRequest();
    const fakeVudy = {
      createPaymentRequest: async () => ({
        id: 'req_persist_fail',
        url: 'https://vudy.app/request/x',
        embedUrl: 'https://vudy.app/embed/request/x',
      }),
    };
    const fakePrisma = {
      invoice: { findUnique: async () => invoice },
      paymentRequest: {
        create: async () => {
          throw new Error('connection refused');
        },
      },
    };

    const service = new InvoicesService(fakePrisma, fakeVudy);

    await assert.rejects(
      () => service.createPaymentRequest('inv_1', PR_DTO),
      (err) => {
        assert.ok(err instanceof PaymentRequestPersistenceError);
        assert.equal(err.getStatus(), 500);
        assert.match(err.message, /req_persist_fail/);
        return true;
      },
    );
  });
});

test('createPaymentRequest throws VudyConfigurationError and never calls Vudy when VUDY_TARGET_ADDRESS is missing', async () => {
  await withTargetAddress(undefined, async () => {
    const invoice = invoiceWithNoPaymentRequest();
    let vudyCalled = false;
    const fakeVudy = { createPaymentRequest: async () => { vudyCalled = true; } };
    const fakePrisma = { invoice: { findUnique: async () => invoice } };

    const service = new InvoicesService(fakePrisma, fakeVudy);

    await assert.rejects(() => service.createPaymentRequest('inv_1', PR_DTO), VudyConfigurationError);
    assert.equal(vudyCalled, false);
  });
});
