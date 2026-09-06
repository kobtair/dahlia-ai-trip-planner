import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explicitCurrency, explicitTravelers } from '../lib/explicit-trip-details.ts';
test('Baku brief does not confuse first person, days or budget with party size', () => {
  assert.equal(explicitTravelers('5 day trip to baku I am starting from Rawalpindi. 7th sept 1500 usd'), undefined);
  assert.equal(explicitTravelers('Just me'), 1);
  assert.equal(explicitTravelers('two people'), 2);
  assert.equal(explicitCurrency('7th sept local scene and food 1500 usd', ['USD','PKR']), 'USD');
});
