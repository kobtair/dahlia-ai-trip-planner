import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendConversationTurn } from '../lib/conversation.ts';

test('Dahlia questions remain part of the conversation turn that asked them', () => {
  const first = appendConversationTurn([], 'A long weekend in Berkeley', 'I can start with that.', [
    'Would you rather focus on food or the outdoors?',
  ]);
  const second = appendConversationTurn(first, 'Outdoors', 'Done — I updated your trip.', []);

  assert.deepEqual(second, [
    { role: 'You', text: 'A long weekend in Berkeley' },
    {
      role: 'Dahlia', text: 'I can start with that.',
      questions: ['Would you rather focus on food or the outdoors?'],
    },
    { role: 'You', text: 'Outdoors' },
    { role: 'Dahlia', text: 'Done — I updated your trip.', questions: [] },
  ]);
});
