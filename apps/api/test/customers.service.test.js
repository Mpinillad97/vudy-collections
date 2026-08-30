'use strict';

// Unit tests for CustomersService. PrismaService is a hand-rolled fake —
// no real database. Runs against the compiled output (`npm run build`
// first) using Node's built-in test runner, matching the pattern from
// M1.2/M1.3.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CustomersService } = require('../dist/customers/customers.service');
const {
  CustomerNotFoundError,
  CustomerPersistenceError,
  CustomerQueryError,
} = require('../dist/customers/customers.exceptions');

const DTO = { name: 'Acme Corp', email: 'billing@acme.com' };

// --- create -----------------------------------------------------------

test('create persists and returns the customer', async () => {
  let createArgs;
  const created = { id: 'cust_1', name: 'Acme Corp', email: 'billing@acme.com', createdAt: new Date() };
  const fakePrisma = {
    customer: {
      create: async (args) => {
        createArgs = args;
        return created;
      },
    },
  };

  const service = new CustomersService(fakePrisma);
  const result = await service.create(DTO);

  assert.deepEqual(result, created);
  // Only name/email are forwarded to Prisma — nothing else leaks through.
  assert.deepEqual(createArgs, { data: { name: 'Acme Corp', email: 'billing@acme.com' } });
});

test('create wraps a Prisma failure in a controlled error', async () => {
  const fakePrisma = {
    customer: {
      create: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
  };

  const service = new CustomersService(fakePrisma);

  await assert.rejects(
    () => service.create(DTO),
    (err) => {
      assert.ok(err instanceof CustomerPersistenceError);
      assert.equal(err.getStatus(), 500);
      assert.doesNotMatch(JSON.stringify(err.getResponse()), /internal-db-host/);
      return true;
    },
  );
});

// --- findById -----------------------------------------------------------

test('findById returns the persisted record when it exists', async () => {
  const stored = { id: 'cust_1', name: 'Acme Corp', email: 'billing@acme.com', createdAt: new Date() };
  let whereArg;
  const fakePrisma = {
    customer: {
      findUnique: async (args) => {
        whereArg = args.where;
        return stored;
      },
    },
  };

  const service = new CustomersService(fakePrisma);
  const result = await service.findById('cust_1');

  assert.deepEqual(result, stored);
  assert.deepEqual(whereArg, { id: 'cust_1' });
});

test('findById throws a 404 CustomerNotFoundError when no record matches', async () => {
  const fakePrisma = {
    customer: {
      findUnique: async () => null,
    },
  };

  const service = new CustomersService(fakePrisma);

  await assert.rejects(
    () => service.findById('does-not-exist'),
    (err) => {
      assert.ok(err instanceof CustomerNotFoundError);
      assert.equal(err.getStatus(), 404);
      assert.match(err.message, /does-not-exist/);
      return true;
    },
  );
});

test('findById converts a Prisma failure into a controlled error without leaking details', async () => {
  const fakePrisma = {
    customer: {
      findUnique: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
  };

  const service = new CustomersService(fakePrisma);

  await assert.rejects(
    () => service.findById('cust_1'),
    (err) => {
      assert.ok(err instanceof CustomerQueryError);
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
    { id: 'cust_2', name: 'B Corp', email: 'b@corp.com', createdAt: new Date('2026-01-02') },
    { id: 'cust_1', name: 'A Corp', email: 'a@corp.com', createdAt: new Date('2026-01-01') },
  ];
  let findManyArgs;
  const fakePrisma = {
    customer: {
      findMany: async (args) => {
        findManyArgs = args;
        return records;
      },
    },
  };

  const service = new CustomersService(fakePrisma);
  const result = await service.findAll();

  assert.deepEqual(result, records);
  assert.deepEqual(findManyArgs, { orderBy: { createdAt: 'desc' } });
});

test('findAll returns an empty array when there are no records, without throwing', async () => {
  const fakePrisma = {
    customer: {
      findMany: async () => [],
    },
  };

  const service = new CustomersService(fakePrisma);
  const result = await service.findAll();

  assert.deepEqual(result, []);
});

test('findAll converts a Prisma failure into a controlled error without leaking details', async () => {
  const fakePrisma = {
    customer: {
      findMany: async () => {
        throw new Error('P1001: Can\'t reach database server at internal-db-host:5432');
      },
    },
  };

  const service = new CustomersService(fakePrisma);

  await assert.rejects(
    () => service.findAll(),
    (err) => {
      assert.ok(err instanceof CustomerQueryError);
      assert.equal(err.getStatus(), 500);
      assert.doesNotMatch(err.message, /internal-db-host/);
      assert.doesNotMatch(JSON.stringify(err.getResponse()), /internal-db-host/);
      return true;
    },
  );
});
