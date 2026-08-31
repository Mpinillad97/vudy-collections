'use strict';

// Runs against the compiled output (`npm run build` first) using Node's
// built-in test runner — no test framework dependency required.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isVudyResponse, isVudyStatusResponse } = require('../dist/vudy/vudy.types');

test('accepts a valid success response', () => {
  assert.equal(
    isVudyResponse({
      success: true,
      data: { id: 'req_abc123', url: 'https://vudy.app/request/tx_xyz789', embedUrl: 'https://vudy.app/embed/request/tx_xyz789' },
    }),
    true,
  );
});

test('rejects a success response missing id', () => {
  assert.equal(
    isVudyResponse({
      success: true,
      data: { url: 'https://vudy.app/request/tx_xyz789', embedUrl: 'https://vudy.app/embed/request/tx_xyz789' },
    }),
    false,
  );
});

test('rejects a success response missing url', () => {
  assert.equal(
    isVudyResponse({
      success: true,
      data: { id: 'req_abc123', embedUrl: 'https://vudy.app/embed/request/tx_xyz789' },
    }),
    false,
  );
});

test('rejects a success response missing embedUrl', () => {
  assert.equal(
    isVudyResponse({
      success: true,
      data: { id: 'req_abc123', url: 'https://vudy.app/request/tx_xyz789' },
    }),
    false,
  );
});

test('rejects a success response with an empty data object', () => {
  assert.equal(isVudyResponse({ success: true, data: {} }), false);
});

test('accepts a valid error response', () => {
  assert.equal(
    isVudyResponse({
      success: false,
      error: { code: 'ERROR_CODE', message: 'Human-readable error message', details: {} },
    }),
    true,
  );
});

test('rejects an error response missing code', () => {
  assert.equal(
    isVudyResponse({
      success: false,
      error: { message: 'Human-readable error message' },
    }),
    false,
  );
});

test('rejects an error response missing message', () => {
  assert.equal(
    isVudyResponse({
      success: false,
      error: { code: 'ERROR_CODE' },
    }),
    false,
  );
});

test('rejects an error response with non-string code/message', () => {
  assert.equal(
    isVudyResponse({
      success: false,
      error: { code: 404, message: null },
    }),
    false,
  );
});

test('rejects a top-level shape without a boolean success field', () => {
  assert.equal(isVudyResponse({ data: {} }), false);
  assert.equal(isVudyResponse({ success: 'true', data: {} }), false);
  assert.equal(isVudyResponse(null), false);
  assert.equal(isVudyResponse('not an object'), false);
});

// --- isVudyStatusResponse (GET /channel/vudy/request/{id}) -----------------
// Shape verified against a real, read-only call to production Vudy.

test('accepts a valid status success response with a null txHash', () => {
  assert.equal(
    isVudyStatusResponse({
      success: true,
      data: { detail: { status: 'pending', txHash: null } },
    }),
    true,
  );
});

test('accepts a valid status success response with a string txHash', () => {
  assert.equal(
    isVudyStatusResponse({
      success: true,
      data: { detail: { status: 'completed', txHash: '0xabc123' } },
    }),
    true,
  );
});

test('rejects a status response missing data.detail', () => {
  assert.equal(isVudyStatusResponse({ success: true, data: {} }), false);
});

test('rejects a status response missing status', () => {
  assert.equal(
    isVudyStatusResponse({ success: true, data: { detail: { txHash: null } } }),
    false,
  );
});

test('rejects a status response with a non-string, non-null txHash', () => {
  assert.equal(
    isVudyStatusResponse({ success: true, data: { detail: { status: 'pending', txHash: 123 } } }),
    false,
  );
});

test('accepts a valid status error response, reusing the same error envelope', () => {
  assert.equal(
    isVudyStatusResponse({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Request not found' },
    }),
    true,
  );
});

test('rejects a status response without a boolean success field', () => {
  assert.equal(isVudyStatusResponse({ data: {} }), false);
  assert.equal(isVudyStatusResponse(null), false);
});
