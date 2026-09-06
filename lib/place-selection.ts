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
export async function selectVerifiedPlaces(ids: string[], generate: (schema: object, retry: boolean, feedback?: string) => Promise<unknown>, minimum = 1): Promise<Selection> {
  const schema = placeSelectionSchema(ids);
  const allowed = new Set(ids);
  const accepted = new Map<string, { id: string; reason: string }>();
  const limitations = new Set<string>();
  let feedback = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await generate(schema, attempt > 0, feedback);
    let unknown = 0, malformed = 0, duplicate = 0;
    if (raw && typeof raw === 'object') {
      const result = raw as Selection;
      if (Array.isArray(result.limitations)) for (const note of result.limitations) if (typeof note === 'string') limitations.add(note);
      if (Array.isArray(result.places)) for (const place of result.places) {
        if (!place || typeof place.id !== 'string' || typeof place.reason !== 'string' || !place.reason.trim()) { malformed++; continue; }
        if (!allowed.has(place.id)) { unknown++; continue; }
        if (accepted.has(place.id)) { duplicate++; continue; }
        accepted.set(place.id, { id: place.id, reason: place.reason.trim() });
      }
      else malformed++;
    } else malformed++;
    if (accepted.size >= minimum) return { places: [...accepted.values()], limitations: [...limitations] };
    console.warn('Dahlia selection validation', { attempt: attempt + 1, offered: ids.length, accepted: accepted.size, minimum, unknown, malformed, duplicate });
    feedback = `Retain these already verified selections: ${[...accepted.keys()].join(', ')}. Provide at least ${minimum} distinct suitable places in total if the candidate evidence supports them. Previous response had ${unknown} unknown IDs, ${malformed} malformed entries and ${duplicate} duplicates. Do not repeat IDs or add unsuitable places just to meet the count.`;
  }
  if (accepted.size) throw new Error(`We could verify ${accepted.size} suitable places, but need ${minimum} for this trip. Try broadening your interests or shortening the trip.`);
  throw new Error('The place selection could not be completed. Your trip details are saved; please retry building. No unverified places were added.');
}
