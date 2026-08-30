'use strict';

// Unit tests for InvoicesController's manual validation. InvoicesService
// is a hand-rolled fake — no real database. Runs against the compiled
// output using Node's built-in test runner.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { BadRequestException } = require('@nestjs/common');
const { InvoicesController } = require('../dist/invoices/invoices.controller');

const VALID = {
  customerId: 'cust_1',
  number: 'INV-001',
  amount: 100,
  currency: 'USD',
  dueDate: '2026-09-15',
};

const serviceThatMustNotBeCalled = {
  create: async () => {
    throw new Error('InvoicesService.create must not be called when validation fails');
  },
  createPaymentRequest: async () => {
    throw new Error('InvoicesService.createPaymentRequest must not be called when validation fails');
  },
};

test('rejects a request with no customerId', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  const { customerId, ...rest } = VALID;
  await assert.rejects(() => controller.create(rest), BadRequestException);
});

test('rejects a request with an empty customerId', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(() => controller.create({ ...VALID, customerId: '   ' }), BadRequestException);
});

test('rejects a request with no number', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  const { number, ...rest } = VALID;
  await assert.rejects(() => controller.create(rest), BadRequestException);
});

test('rejects a request with an empty number', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(() => controller.create({ ...VALID, number: '' }), BadRequestException);
});

test('rejects a request with no amount', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  const { amount, ...rest } = VALID;
  await assert.rejects(() => controller.create(rest), BadRequestException);
});

test('rejects a request with amount <= 0', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(() => controller.create({ ...VALID, amount: 0 }), BadRequestException);
  await assert.rejects(() => controller.create({ ...VALID, amount: -5 }), BadRequestException);
});

test('rejects a request with a non-numeric amount', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(() => controller.create({ ...VALID, amount: '100' }), BadRequestException);
});

test('rejects a request with no currency', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  const { currency, ...rest } = VALID;
  await assert.rejects(() => controller.create(rest), BadRequestException);
});

test('rejects a request with an empty currency', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(() => controller.create({ ...VALID, currency: '' }), BadRequestException);
});

test('rejects a request with no dueDate', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  const { dueDate, ...rest } = VALID;
  await assert.rejects(() => controller.create(rest), BadRequestException);
});

test('rejects a request with an invalid dueDate', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(() => controller.create({ ...VALID, dueDate: 'not-a-date' }), BadRequestException);
});

test('accepts a valid payload and forwards only the documented fields, dropping extra properties', async () => {
  let receivedArgs;
  const fakeService = {
    create: async (dto) => {
      receivedArgs = dto;
      return {
        id: 'inv_1',
        customerId: dto.customerId,
        number: dto.number,
        amount: dto.amount,
        currency: dto.currency,
        dueDate: new Date(dto.dueDate),
        createdAt: new Date(),
      };
    },
  };
  const controller = new InvoicesController(fakeService);

  const result = await controller.create({
    ...VALID,
    extra: 'should not be forwarded',
    paymentRequestId: 'should-be-ignored',
  });

  assert.deepEqual(receivedArgs, VALID);
  assert.equal(result.success, true);
  assert.equal(result.data.number, 'INV-001');
});

// --- POST /invoices/:id/payment-request ------------------------------------

test('createPaymentRequest rejects a request with no requestedChain', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.createPaymentRequest('inv_1', { requestedToken: 'USDC' }),
    BadRequestException,
  );
});

test('createPaymentRequest rejects a request with an empty requestedChain', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.createPaymentRequest('inv_1', { requestedChain: '  ', requestedToken: 'USDC' }),
    BadRequestException,
  );
});

test('createPaymentRequest rejects a request with no requestedToken', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.createPaymentRequest('inv_1', { requestedChain: 'ethereum' }),
    BadRequestException,
  );
});

test('createPaymentRequest rejects a request with an empty requestedToken', async () => {
  const controller = new InvoicesController(serviceThatMustNotBeCalled);
  await assert.rejects(
    () => controller.createPaymentRequest('inv_1', { requestedChain: 'ethereum', requestedToken: '' }),
    BadRequestException,
  );
});

test('createPaymentRequest accepts a valid payload and never forwards a client-supplied amount/targetAddress (8)', async () => {
  let receivedInvoiceId;
  let receivedDto;
  const fakeService = {
    createPaymentRequest: async (invoiceId, dto) => {
      receivedInvoiceId = invoiceId;
      receivedDto = dto;
      return { id: 'pr_1', invoiceId, vudyRequestId: 'req_abc123' };
    },
  };
  const controller = new InvoicesController(fakeService);

  const result = await controller.createPaymentRequest('inv_1', {
    requestedChain: 'ethereum',
    requestedToken: 'USDC',
    // A caller could try to inject these — they must never reach the service.
    amount: 999999,
    targetAddress: '0xATTACKER_CONTROLLED',
  });

  assert.equal(receivedInvoiceId, 'inv_1');
  assert.deepEqual(receivedDto, { requestedChain: 'ethereum', requestedToken: 'USDC' });
  assert.equal(result.success, true);
  assert.equal(result.data.id, 'pr_1');
});
