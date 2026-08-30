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
  InvoicePersistenceError,
  InvoiceQueryError,
} = require('../dist/invoices/invoices.exceptions');

const DTO = {
  customerId: 'cust_1',
  number: 'INV-001',
  amount: 100,
  currency: 'USD',
  dueDate: '2026-09-15',
};

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

  const service = new InvoicesService(fakePrisma);
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

  const service = new InvoicesService(fakePrisma);

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

  const service = new InvoicesService(fakePrisma);

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

  const service = new InvoicesService(fakePrisma);

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

test('findById returns the persisted record when it exists', async () => {
  const stored = {
    id: 'inv_1',
    customerId: 'cust_1',
    number: 'INV-001',
    amount: '100',
    currency: 'USD',
    dueDate: new Date('2026-09-15'),
    createdAt: new Date(),
  };
  let whereArg;
  const fakePrisma = {
    invoice: {
      findUnique: async (args) => {
        whereArg = args.where;
        return stored;
      },
    },
  };

  const service = new InvoicesService(fakePrisma);
  const result = await service.findById('inv_1');

  assert.deepEqual(result, stored);
  assert.deepEqual(whereArg, { id: 'inv_1' });
});

test('findById throws a 404 InvoiceNotFoundError when no record matches', async () => {
  const fakePrisma = {
    invoice: {
      findUnique: async () => null,
    },
  };

  const service = new InvoicesService(fakePrisma);

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

  const service = new InvoicesService(fakePrisma);

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

  const service = new InvoicesService(fakePrisma);
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

  const service = new InvoicesService(fakePrisma);
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

  const service = new InvoicesService(fakePrisma);

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
