'use strict';

// Unit tests for CustomersController's manual validation. CustomersService
// is a hand-rolled fake — no real database. Runs against the compiled
// output using Node's built-in test runner.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BadRequestException } = require('@nestjs/common');
const { CustomersController } = require('../dist/customers/customers.controller');

const serviceThatMustNotBeCalled = {
  create: async () => {
    throw new Error('CustomersService.create must not be called when validation fails');
  },
};

test('rejects a request with no name', async () => {
  const controller = new CustomersController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.create({ email: 'billing@acme.com' }),
    BadRequestException,
  );
});

test('rejects a request with an empty/whitespace name', async () => {
  const controller = new CustomersController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.create({ name: '   ', email: 'billing@acme.com' }),
    BadRequestException,
  );
});

test('rejects a request with a non-string name', async () => {
  const controller = new CustomersController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.create({ name: 12345, email: 'billing@acme.com' }),
    BadRequestException,
  );
});

test('rejects a request with no email', async () => {
  const controller = new CustomersController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.create({ name: 'Acme Corp' }),
    BadRequestException,
  );
});

test('rejects a request with a malformed email', async () => {
  const controller = new CustomersController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.create({ name: 'Acme Corp', email: 'not-an-email' }),
    BadRequestException,
  );
});

test('accepts valid input and forwards only name/email to the service, dropping extra properties', async () => {
  let receivedArgs;
  const fakeService = {
    create: async (dto) => {
      receivedArgs = dto;
      return { id: 'cust_1', name: dto.name, email: dto.email, createdAt: new Date() };
    },
  };
  const controller = new CustomersController(fakeService);

  const result = await controller.create({
    name: 'Acme Corp',
    email: 'billing@acme.com',
    extra: 'should not be forwarded',
    targetAddress: '0xSHOULD_BE_IGNORED',
  });

  assert.deepEqual(receivedArgs, { name: 'Acme Corp', email: 'billing@acme.com' });
  assert.equal(result.success, true);
  assert.equal(result.data.name, 'Acme Corp');
});
