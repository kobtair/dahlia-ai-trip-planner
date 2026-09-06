import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRENCIES, currencyLabel } from '../lib/currencies.ts';
import { usdExchangeRate } from '../lib/exchange-rates.ts';

test('currency options include regional currencies with readable labels', () => {
  assert.equal(new Set(CURRENCIES).size, CURRENCIES.length);
  for (const code of ['PKR', 'AED', 'AZN', 'SAR', 'BDT']) assert.ok(CURRENCIES.includes(code));
  assert.match(currencyLabel('PKR'), /Pakistani Rupee/);
});

test('conversion validates rates, caches requests and never substitutes USD', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  try {
    globalThis.fetch = async () => {
      requests++;
      return Response.json({ result: 'success', base_code: 'USD', time_last_update_unix: Date.now() / 1000, rates: { PKR: 280, AED: 3.67 } });
    };
    assert.equal(await usdExchangeRate('USD'), 1);
    assert.equal(await usdExchangeRate('PKR'), 280);
    assert.equal(await usdExchangeRate('AED'), 3.67);
    assert.equal(requests, 1);
    await assert.rejects(usdExchangeRate('INVALID'), /unavailable/);
  } finally { globalThis.fetch = original; }
});
