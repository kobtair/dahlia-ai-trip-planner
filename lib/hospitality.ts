export type HospitalityPlace = {
  id: string; name: string; kind: 'restaurant' | 'hotel'; latitude: number; longitude: number;
  sourceUrl: string; website?: string; cuisine?: string; openingHours?: string;
  stars?: string; dietaryInfo?: string; imageUrl?: string;
};

export function hospitalityPlaces(elements: Array<{ type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>): HospitalityPlace[] {
  return elements.flatMap((element) => {
    const tags = element.tags || {};
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    const kind = tags.amenity === 'restaurant' ? 'restaurant' : tags.tourism === 'hotel' ? 'hotel' : null;
    if (!kind || !tags.name || latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const website = tags.website || tags['contact:website'];
    return [{ id: `osm-${element.type}-${element.id}`, name: tags.name, kind, latitude, longitude,
      sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      website: website && /^https?:\/\//i.test(website) ? website : undefined,
      cuisine: tags.cuisine?.replaceAll(';', ', '), openingHours: tags.opening_hours, stars: tags.stars,
      dietaryInfo: ['halal', 'vegan', 'vegetarian', 'gluten_free'].filter((diet) => tags[`diet:${diet}`] === 'yes' || tags[`diet:${diet}`] === 'only').join(', ').replaceAll('_', ' ') || undefined,
      imageUrl: tags.image && /^https:\/\/upload\.wikimedia\.org\//.test(tags.image) ? tags.image : undefined,
    } satisfies HospitalityPlace];
  });
}

export async function findHospitality(latitude: number, longitude: number) {
  const query = `[out:json][timeout:12];nwr(around:2500,${latitude},${longitude})[amenity=restaurant][name];out center tags 40;nwr(around:5000,${latitude},${longitude})[tourism=hotel][name];out center tags 40;`;
  let lastError: unknown;
  for (const endpoint of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    try {
      const response = await fetch(`${endpoint}?${new URLSearchParams({ data: query })}`, { headers: { Accept: 'application/json', 'User-Agent': 'DahliaTripPlanner/0.1' }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Place provider unavailable');
      const data = await response.json() as { elements?: Parameters<typeof hospitalityPlaces>[0] };
      if (!Array.isArray(data.elements)) throw new Error('Invalid provider response');
      return hospitalityPlaces(data.elements).sort((a, b) => ((a.latitude - latitude) ** 2 + (a.longitude - longitude) ** 2) - ((b.latitude - latitude) ** 2 + (b.longitude - longitude) ** 2));
    } catch (error) { lastError = error; }
  }
  throw lastError;
}
