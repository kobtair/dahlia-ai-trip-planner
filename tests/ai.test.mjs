import { test } from 'node:test';
import assert from 'node:assert/strict';
import { structuredAI, objectSchema } from '../lib/ai.ts';

test('AI calls real Responses format and never silently falls back', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(structuredAI('test', {}, '', {}), /not configured/);
    process.env.OPENAI_API_KEY = 'test-only-not-a-real-key';
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'https://api.openai.com/v1/responses');
      const body = JSON.parse(init.body);
      assert.equal(body.store, false);
      assert.equal(body.text.format.strict, true);
      return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: '{"destination":"Dubai"}' }] }] });
    };
    assert.deepEqual(await structuredAI('brief', objectSchema({ destination: { type: 'string' } }), 'Extract', 'go to Dubai'), { destination: 'Dubai' });
    globalThis.fetch = async () => Response.json({}, { status: 429 });
    await assert.rejects(structuredAI('test', {}, '', {}), /usage limit/);
    globalThis.fetch = async () => Response.json({ status: 'incomplete' });
    await assert.rejects(structuredAI('test', {}, '', {}), /incomplete/);
    globalThis.fetch = async () => Response.json({ status: 'completed', output: [{ content: [{ type: 'refusal' }] }] });
    await assert.rejects(structuredAI('test', {}, '', {}), /rephrase/);
    globalThis.fetch = async () => Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: 'not json' }] }] });
    await assert.rejects(structuredAI('test', {}, '', {}), /invalid response/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
