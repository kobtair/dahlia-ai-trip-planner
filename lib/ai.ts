// Server routes only. Never import this module into a client component.
export async function structuredAI<T>(name: string, schema: object, instructions: string, input: unknown): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('AI is not configured. Add OPENAI_API_KEY to the server environment and redeploy.');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', store: false,
      instructions, input: JSON.stringify(input), max_output_tokens: 5000,
      text: { format: { type: 'json_schema', name, strict: true, schema } },
    }),
  });
  if (!response.ok) throw new Error(response.status === 429
    ? 'The AI provider is at its usage limit. Please retry later or check API billing.'
    : 'The AI provider could not complete the request. Check the server API configuration and retry.');
  const data = await response.json() as { status?: string; output?: Array<{ content?: Array<{ type: string; text?: string }> }> };
  if (data.status !== 'completed') throw new Error('AI interpretation was incomplete. Please retry.');
  const content = (data.output || []).flatMap((item: { content?: Array<{ type: string; text?: string }> }) => item.content || []);
  if (content.some((item: { type: string }) => item.type === 'refusal')) throw new Error('The AI could not interpret that request. Please rephrase your travel plans.');
  const text = content.filter((item) => item.type === 'output_text').map((item) => item.text || '').join('');
  try { return JSON.parse(text) as T; } catch { throw new Error('AI returned an invalid response. Please retry.'); }
}

export function objectSchema(properties: Record<string, unknown>) {
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}
