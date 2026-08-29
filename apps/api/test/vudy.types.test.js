'use strict';

// Runs against the compiled output (`npm run build` first) using Node's
// built-in test runner — no test framework dependency required.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isVudyResponse } = require('../dist/vudy/vudy.types');

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
