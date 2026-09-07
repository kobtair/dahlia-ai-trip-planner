import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completeTripBrief, reconcileAssumptions } from '../lib/trip-assumptions.ts';

test('an open-ended long weekend becomes an immediately buildable trip', () => {
  const result = completeTripBrief(
    { destination: 'Berkeley, California', durationDays: 3 },
    'A long weekend in Berkeley, any random weekend',
    '2026-09-07',
  );

  assert.deepEqual(result.brief, {
    destination: 'Berkeley, California',
    durationDays: 3,
    origin: 'Berkeley, California',
    startDate: '2026-09-11',
    endDate: '2026-09-13',
    travelers: 1,
    travelersConfirmed: true,
    budget: 0,
    currency: 'USD',
    pace: 'balanced',
    interests: [],
    destinationScope: 'city',
  });
  assert.deepEqual(result.assumedFields, ['origin', 'startDate', 'travelers', 'budget', 'currency', 'pace']);
});

test('existing details and explicit revisions are not replaced by defaults', () => {
  const result = completeTripBrief(
    {
      destination: 'Berkeley, California', origin: 'Oakland, California', durationDays: 3,
      startDate: '2026-10-02', endDate: '2026-10-04', travelers: 2,
      travelersConfirmed: true, budget: 900, currency: 'CAD', pace: 'slow',
      interests: ['family activities'], destinationScope: 'city',
    },
    'Make the trip slower',
    '2026-09-07',
  );

  assert.equal(result.brief.origin, 'Oakland, California');
  assert.equal(result.brief.startDate, '2026-10-02');
  assert.equal(result.brief.travelers, 2);
  assert.equal(result.brief.currency, 'CAD');
  assert.deepEqual(result.assumedFields, []);
});

test('explicit date ranges determine duration instead of receiving a conflicting default', () => {
  const result = completeTripBrief(
    { destination: 'Lisbon', startDate: '2026-10-02', endDate: '2026-10-06' },
    'Lisbon from October 2 to October 6',
    '2026-09-07',
  );

  assert.equal(result.brief.durationDays, 5);
  assert.equal(result.brief.endDate, '2026-10-06');
  assert.equal(result.assumedFields.includes('durationDays'), false);
});

test('new assumptions produce one non-blocking confirmation question', () => {
  const brief = {
    destination: 'Berkeley, California', origin: 'Berkeley, California',
    startDate: '2026-09-11', endDate: '2026-09-13', durationDays: 3,
    travelers: 1, budget: 0, currency: 'USD', pace: 'balanced',
  };
  const result = reconcileAssumptions({
    previous: [], previousBrief: {}, nextBrief: brief,
    newlyAssumedFields: ['origin', 'startDate', 'travelers', 'budget', 'currency', 'pace'],
    message: 'A long weekend in Berkeley',
  });

  assert.deepEqual(result.assumptions, [
    { field: 'origin', value: 'Berkeley, California', askCount: 1 },
    { field: 'startDate', value: '2026-09-11', askCount: 1 },
    { field: 'travelers', value: 1, askCount: 1 },
    { field: 'budget', value: 0, askCount: 1 },
    { field: 'currency', value: 'USD', askCount: 1 },
    { field: 'pace', value: 'balanced', askCount: 1 },
  ]);
  assert.equal(result.question, 'I assumed September 11–13, 2026, a local start in Berkeley, California, 1 traveler, no fixed budget, USD estimates, and a balanced pace. Is that right? If not, tell me what to change.');
});

test('an explicit answer replaces the changed assumption and retains the others', () => {
  const previousBrief = { origin: 'Berkeley, California', travelers: 1 };
  const nextBrief = { origin: 'Berkeley, California', travelers: 2 };
  const result = reconcileAssumptions({
    previous: [
      { field: 'origin', value: 'Berkeley, California', askCount: 1 },
      { field: 'travelers', value: 1, askCount: 1 },
    ],
    previousBrief,
    nextBrief,
    newlyAssumedFields: [],
    message: 'No, there are two people',
  });

  assert.deepEqual(result.assumptions, [
    { field: 'origin', value: 'Berkeley, California', askCount: 2 },
  ]);
  assert.equal(result.question, 'I assumed a local start in Berkeley, California. Is that right? If not, tell me what to change.');
});

test('an unclear answer keeps the assumption but never asks a third time', () => {
  const brief = { origin: 'Berkeley, California' };
  const result = reconcileAssumptions({
    previous: [{ field: 'origin', value: 'Berkeley, California', askCount: 2 }],
    previousBrief: brief,
    nextBrief: brief,
    newlyAssumedFields: [],
    message: 'I am not sure',
  });

  assert.deepEqual(result.assumptions, [
    { field: 'origin', value: 'Berkeley, California', askCount: 2 },
  ]);
  assert.equal(result.question, null);
});

test('a clear confirmation resolves all active assumptions', () => {
  const brief = { origin: 'Berkeley, California', travelers: 1 };
  const result = reconcileAssumptions({
    previous: [
      { field: 'origin', value: 'Berkeley, California', askCount: 1 },
      { field: 'travelers', value: 1, askCount: 1 },
    ],
    previousBrief: brief,
    nextBrief: brief,
    newlyAssumedFields: [],
    message: 'Yes, that sounds good',
  });

  assert.deepEqual(result.assumptions, []);
  assert.equal(result.question, null);
});
