'use strict';

// Unit tests for the domain orchestration in PaymentRequestsService.
// VudyService and PrismaService are hand-rolled fakes — no real Vudy calls,
// no real database. Runs against the compiled output (`npm run build` first)
// using Node's built-in test runner, matching the pattern from M1.1.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PaymentRequestsService } = require('../dist/payment-requests/payment-requests.service');
const {
  PaymentRequestNotFoundError,
  PaymentRequestPersistenceError,
  PaymentRequestQueryError,
} = require('../dist/payment-requests/payment-requests.exceptions');
const { VudyConfigurationError, VudyUpstreamError } = require('../dist/vudy/vudy.exceptions');

// A VudyService stub that fails loudly if the read paths ever touch it —
// findById/findAll must never call Vudy.
const vudyServiceThatMustNotBeCalled = {
  createPaymentRequest: async () => {
    throw new Error('VudyService.createPaymentRequest must not be called by a read operation');
  },
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

const DTO = {
  amount: 1,
  currencyToken: 'USD',
  requestedChain: 'ethereum',
  requestedToken: 'USDC',
  customId: 'test-custom-id',
  note: 'test note',
};

test('creates and persists a payment request after Vudy confirms it', async () => {
  await withTargetAddress('0xTARGET', async () => {
    let vudyCallArgs;
    let prismaCallArgs;
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
    const persisted = { id: 'local_1', vudyRequestId: 'req_abc123' };
    const fakePrisma = {
      paymentRequest: {
        create: async (args) => {
          prismaCallArgs = args;
          return persisted;
        },
      },
    };

    const service = new PaymentRequestsService(fakeVudy, fakePrisma);
    const result = await service.create(DTO);

    assert.deepEqual(result, persisted);

    // Vudy is called with our configured target address, never a caller-supplied one.
    assert.equal(vudyCallArgs.targetAddress, '0xTARGET');
    assert.equal(vudyCallArgs.amount, 1);
    assert.deepEqual(vudyCallArgs.channelParams, {
      customId: 'test-custom-id',
      note: 'test note',
      currencyToken: 'USD',
      requestedChain: 'ethereum',
      requestedToken: 'USDC',
    });

    // The local record maps Vudy's response data plus our own request context.
    assert.equal(prismaCallArgs.data.vudyRequestId, 'req_abc123');
    assert.equal(prismaCallArgs.data.vudyUrl, 'https://vudy.app/request/tx_xyz789');
    assert.equal(prismaCallArgs.data.vudyEmbedUrl, 'https://vudy.app/embed/request/tx_xyz789');
    assert.equal(prismaCallArgs.data.targetAddress, '0xTARGET');
    assert.equal(prismaCallArgs.data.amount, 1);
    assert.equal(prismaCallArgs.data.currencyToken, 'USD');
  });
});

test('never calls Vudy or Prisma when VUDY_TARGET_ADDRESS is missing', async () => {
  await withTargetAddress(undefined, async () => {
    let vudyCalled = false;
    let prismaCalled = false;
    const fakeVudy = {
      createPaymentRequest: async () => {
        vudyCalled = true;
      },
    };
    const fakePrisma = {
      paymentRequest: {
        create: async () => {
          prismaCalled = true;
        },
      },
    };

    const service = new PaymentRequestsService(fakeVudy, fakePrisma);

    await assert.rejects(() => service.create(DTO), VudyConfigurationError);
    assert.equal(vudyCalled, false, 'Vudy should never be called without a configured target address');
    assert.equal(prismaCalled, false, 'nothing should be persisted without a configured target address');
  });
});

test('propagates Vudy upstream errors and persists nothing', async () => {
  await withTargetAddress('0xTARGET', async () => {
    let prismaCalled = false;
    const fakeVudy = {
      createPaymentRequest: async () => {
        throw new VudyUpstreamError(403, 'SERVER_VALIDATION_API_AUTH_02', 'Invalid API key format');
      },
    };
    const fakePrisma = {
      paymentRequest: {
        create: async () => {
          prismaCalled = true;
        },
      },
    };

    const service = new PaymentRequestsService(fakeVudy, fakePrisma);

    await assert.rejects(() => service.create(DTO), VudyUpstreamError);
    assert.equal(prismaCalled, false, 'a failed Vudy request must never be persisted');
  });
});

test('wraps a persistence failure that happens after a successful Vudy call', async () => {
  await withTargetAddress('0xTARGET', async () => {
    const fakeVudy = {
      createPaymentRequest: async () => ({
        id: 'req_persist_fail',
        url: 'https://vudy.app/request/x',
        embedUrl: 'https://vudy.app/embed/request/x',
      }),
    };
    const fakePrisma = {
      paymentRequest: {
        create: async () => {
          throw new Error('connection refused');
        },
      },
    };

    const service = new PaymentRequestsService(fakeVudy, fakePrisma);

    await assert.rejects(
      () => service.create(DTO),
      (err) => {
        assert.ok(err instanceof PaymentRequestPersistenceError);
        assert.equal(err.getStatus(), 500);
        // The real Vudy request id must surface so it can be reconciled manually.
        assert.match(err.message, /req_persist_fail/);
        return true;
      },
    );
  });
});

// --- findById -----------------------------------------------------------

test('findById returns the persisted record when it exists', async () => {
  const stored = {
    id: 'local_1',
    vudyRequestId: 'req_abc123',
    vudyUrl: 'https://vudy.app/request/tx_xyz789',
    vudyEmbedUrl: 'https://vudy.app/embed/request/tx_xyz789',
    targetAddress: '0xTARGET',
    amount: '1',
    currencyToken: 'USD',
    requestedChain: 'ethereum',
    requestedToken: 'USDC',
    customId: null,
    note: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  let whereArg;
  const fakePrisma = {
    paymentRequest: {
      findUnique: async (args) => {
        whereArg = args.where;
        return stored;
      },
    },
  };

  const service = new PaymentRequestsService(vudyServiceThatMustNotBeCalled, fakePrisma);
  const result = await service.findById('local_1');

  assert.deepEqual(result, stored);
  assert.deepEqual(whereArg, { id: 'local_1' });
});

test('findById throws a 404 PaymentRequestNotFoundError when no record matches', async () => {
  const fakePrisma = {
    paymentRequest: {
      findUnique: async () => null,
    },
  };

  const service = new PaymentRequestsService(vudyServiceThatMustNotBeCalled, fakePrisma);

  await assert.rejects(
    () => service.findById('does-not-exist'),
    (err) => {
      assert.ok(err instanceof PaymentRequestNotFoundError);
      assert.equal(err.getStatus(), 404);
      assert.match(err.message, /does-not-exist/);
      return true;
    },
  );
});

test('findById converts a Prisma failure into a controlled error without leaking details', async () => {
  const fakePrisma = {
    paymentRequest: {
      findUnique: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
  };

  const service = new PaymentRequestsService(vudyServiceThatMustNotBeCalled, fakePrisma);

  await assert.rejects(
    () => service.findById('local_1'),
    (err) => {
      assert.ok(err instanceof PaymentRequestQueryError);
      assert.equal(err.getStatus(), 500);
      // The raw Prisma error text (host, port, driver internals) must never surface.
      assert.doesNotMatch(err.message, /internal-db-host/);
      assert.doesNotMatch(JSON.stringify(err.getResponse()), /internal-db-host/);
      return true;
    },
  );
});

// --- findAll --------------------------------------------------------------

test('findAll returns the persisted records ordered by most recent first', async () => {
  const records = [
    { id: 'local_2', vudyRequestId: 'req_2', createdAt: new Date('2026-01-02T00:00:00.000Z') },
    { id: 'local_1', vudyRequestId: 'req_1', createdAt: new Date('2026-01-01T00:00:00.000Z') },
  ];
  let findManyArgs;
  const fakePrisma = {
    paymentRequest: {
      findMany: async (args) => {
        findManyArgs = args;
        return records;
      },
    },
  };

  const service = new PaymentRequestsService(vudyServiceThatMustNotBeCalled, fakePrisma);
  const result = await service.findAll();

  assert.deepEqual(result, records);
  assert.deepEqual(findManyArgs, { orderBy: { createdAt: 'desc' } });
});

test('findAll returns an empty array when there are no records, without throwing', async () => {
  const fakePrisma = {
    paymentRequest: {
      findMany: async () => [],
    },
  };

  const service = new PaymentRequestsService(vudyServiceThatMustNotBeCalled, fakePrisma);
  const result = await service.findAll();

  assert.deepEqual(result, []);
});

test('findAll converts a Prisma failure into a controlled error without leaking details', async () => {
  const fakePrisma = {
    paymentRequest: {
      findMany: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
  };

  const service = new PaymentRequestsService(vudyServiceThatMustNotBeCalled, fakePrisma);

  await assert.rejects(
    () => service.findAll(),
    (err) => {
      assert.ok(err instanceof PaymentRequestQueryError);
      assert.equal(err.getStatus(), 500);
      assert.doesNotMatch(err.message, /internal-db-host/);
      assert.doesNotMatch(JSON.stringify(err.getResponse()), /internal-db-host/);
      return true;
    },
  );
});
