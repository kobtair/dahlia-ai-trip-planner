import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wantsCountryRoute } from '../lib/country-route.ts';
test('explicit whole-country intent is a route mode, not a repeated base question', () => {
  assert.equal(wantsCountryRoute('Nothing in mind. Plan the entire country.', 'country'), true);
  assert.equal(wantsCountryRoute('No base, country-wide route please.', 'country'), true);
  assert.equal(wantsCountryRoute('Switzerland', 'country'), false);
  assert.equal(wantsCountryRoute('Plan the entire country', 'city'), false);
});
