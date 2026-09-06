type Selection = { places: Array<{ id: string; reason: string }>; limitations: string[] };

export function placeSelectionSchema(ids: string[]) {
  if (!ids.length) throw new Error('No sourced places are available for this destination.');
  return {
    type: 'object', additionalProperties: false, required: ['places', 'limitations'],
    properties: {
      places: { type: 'array', items: {
        type: 'object', additionalProperties: false, required: ['id', 'reason'],
        properties: { id: { type: 'string', enum: [...new Set(ids)] }, reason: { type: 'string' } },
      } },
      limitations: { type: 'array', items: { type: 'string' } },
    },
  };
}

export function validatePlaceSelection(value: unknown, ids: string[]): Selection | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as Selection;
  if (!Array.isArray(result.places) || !Array.isArray(result.limitations) || result.limitations.some((v) => typeof v !== 'string')) return null;
  const allowed = new Set(ids);
  const seen = new Set<string>();
  for (const place of result.places) {
    if (!place || typeof place !== 'object' || !allowed.has(place.id) || seen.has(place.id) || typeof place.reason !== 'string' || !place.reason.trim()) return null;
    seen.add(place.id);
  }
  return result;
}

// Retry only invalid selections, not billing, configuration or provider errors.
export async function selectVerifiedPlaces(ids: string[], generate: (schema: object, retry: boolean) => Promise<unknown>): Promise<Selection> {
  const schema = placeSelectionSchema(ids);
  for (let attempt = 0; attempt < 2; attempt++) {
    const selection = validatePlaceSelection(await generate(schema, attempt > 0), ids);
    if (selection) return selection;
  }
  throw new Error('We could not safely match the AI recommendations to sourced places. No unverified places were added. Please try again.');
}
