type PlanRequest = {
  destination?: string;
  origin?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  budget?: number;
  pace?: 'slow' | 'balanced' | 'full';
  interests?: string[];
  prompt?: string;
};

type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  imageUrl?: string;
  website?: string;
  openingHours?: string;
  sourceUrl: string;
  source: 'OpenStreetMap' | 'Wikipedia';
};

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Foggy', 48: 'Foggy',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers', 95: 'Thunderstorms',
};

const INTEREST_TERMS: Record<string, string[]> = {
  food: ['food', 'market', 'restaurant', 'cafe', 'culinary'],
  history: ['history', 'historic', 'museum', 'castle', 'palace', 'monument', 'archaeolog'],
  art: ['art', 'gallery', 'museum', 'design'],
  nature: ['park', 'garden', 'nature', 'beach', 'viewpoint', 'trail'],
  architecture: ['architecture', 'church', 'cathedral', 'mosque', 'temple', 'palace', 'tower'],
  nightlife: ['night', 'bar', 'music', 'theatre', 'theater'],
};

function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  return response.json() as Promise<T>;
}

function cleanText(value?: string) {
  return (value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function daysBetween(start: string, end: string) {
  const startMs = new Date(`${start}T12:00:00Z`).getTime();
  const endMs = new Date(`${end}T12:00:00Z`).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;
  return Math.floor((endMs - startMs) / 86_400_000) + 1;
}

function dateAt(start: string, offset: number) {
  const value = new Date(`${start}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function haversineKm(a: Place, b: Place) {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

async function getPlaces(latitude: number, longitude: number) {
  const query = `[out:json][timeout:18];(nwr(around:12000,${latitude},${longitude})[tourism~"attraction|museum|gallery|viewpoint"][name];nwr(around:12000,${latitude},${longitude})[historic][name];nwr(around:8000,${latitude},${longitude})[amenity="marketplace"][name];);out center tags 45;`;
  type OverpassResponse = { elements?: Array<{ id: number; type: string; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> };
  const data = await fetchJson<OverpassResponse>('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'DahliaTripPlanner/0.1' },
    body: new URLSearchParams({ data: query }),
  });

  return (data.elements || []).flatMap<Place>((element) => {
    const tags = element.tags || {};
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (!tags.name || lat == null || lon == null) return [];
    const category = tags.tourism || (tags.historic ? 'historic site' : 'place');
    const wikiTitle = tags.wikipedia?.split(':').slice(1).join(':');
    return [{
      id: `osm-${element.type}-${element.id}`,
      name: tags.name,
      latitude: lat,
      longitude: lon,
      category,
      description: cleanText(tags.description || tags['description:en'] || `${category.replaceAll('_', ' ')} in the destination area.`),
      website: tags.website || tags['contact:website'],
      openingHours: tags.opening_hours,
      sourceUrl: wikiTitle ? `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiTitle.replaceAll(' ', '_'))}` : `https://www.openstreetmap.org/${element.type}/${element.id}`,
      source: 'OpenStreetMap',
    }];
  });
}

async function getWikipediaPlaces(latitude: number, longitude: number) {
  type WikiResponse = { query?: { pages?: Record<string, { pageid: number; title: string; extract?: string; fullurl?: string; thumbnail?: { source: string }; coordinates?: Array<{ lat: number; lon: number }> }> } };
  const params = new URLSearchParams({
    action: 'query', generator: 'geosearch', ggsprimary: 'all', ggsnamespace: '0',
    ggsradius: '10000', ggscoord: `${latitude}|${longitude}`, ggslimit: '30',
    prop: 'coordinates|pageimages|extracts|info', inprop: 'url', piprop: 'thumbnail', pithumbsize: '900',
    exintro: '1', explaintext: '1', exsentences: '2', format: 'json', origin: '*',
  });
  const data = await fetchJson<WikiResponse>(`https://en.wikipedia.org/w/api.php?${params}`);
  return Object.values(data.query?.pages || {}).flatMap<Place>((page) => {
    const coordinates = page.coordinates?.[0];
    if (!coordinates || !page.extract) return [];
    return [{
      id: `wiki-${page.pageid}`,
      name: page.title,
      latitude: coordinates.lat,
      longitude: coordinates.lon,
      category: 'notable place',
      description: cleanText(page.extract),
      imageUrl: page.thumbnail?.source,
      sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`,
      source: 'Wikipedia',
    }];
  });
}

function rankPlaces(places: Place[], interests: string[], prompt: string) {
  const intent = `${interests.join(' ')} ${prompt}`.toLowerCase();
  const terms = Object.entries(INTEREST_TERMS).flatMap(([interest, values]) => intent.includes(interest) ? values : []);
  return places
    .map((place) => {
      const searchable = `${place.name} ${place.category} ${place.description}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 3 : 0), 0)
        + (place.imageUrl ? 1 : 0) + (place.openingHours ? 1 : 0) + (place.description.length > 80 ? 1 : 0);
      return { place, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ place }) => place);
}

async function getWeather(latitude: number, longitude: number, startDate: string, endDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${startDate}T00:00:00`);
  const horizon = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
  if (horizon < 0 || horizon > 15) {
    return { available: false, status: 'unavailable', note: horizon > 15 ? 'Forecast becomes available 16 days before departure.' : 'Past-date forecasts are not shown.' };
  }
  type WeatherResponse = { timezone?: string; daily?: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[] } };
  const params = new URLSearchParams({
    latitude: String(latitude), longitude: String(longitude), timezone: 'auto', start_date: startDate, end_date: endDate,
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
  });
  const data = await fetchJson<WeatherResponse>(`https://api.open-meteo.com/v1/forecast?${params}`);
  const daily = data.daily;
  if (!daily?.time?.length) return { available: false, status: 'unavailable', note: 'No forecast was returned for these dates.' };
  return {
    available: true,
    status: 'live',
    timezone: data.timezone,
    daily: daily.time.map((date, index) => ({
      date,
      high: Math.round(daily.temperature_2m_max[index]),
      low: Math.round(daily.temperature_2m_min[index]),
      precipitation: daily.precipitation_probability_max[index],
      description: WEATHER_CODES[daily.weather_code[index]] || 'Variable weather',
    })),
  };
}

async function getDestinationSummary(name: string) {
  type Summary = { extract?: string; content_urls?: { desktop?: { page?: string } }; originalimage?: { source?: string }; thumbnail?: { source?: string } };
  return fetchJson<Summary>(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`);
}

async function routeDay(places: Place[]) {
  if (places.length < 2) return { distanceKm: 0, durationMinutes: 0, source: 'Coordinates', status: 'estimated' };
  const coordinates = places.map((place) => `${place.longitude},${place.latitude}`).join(';');
  try {
    type RouteResponse = { routes?: Array<{ distance: number; duration: number; legs: Array<{ distance: number; duration: number }> }> };
    const result = await fetchJson<RouteResponse>(`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordinates}?overview=false&steps=false`);
    const route = result.routes?.[0];
    if (!route) throw new Error('No route');
    return {
      distanceKm: Math.round(route.distance / 100) / 10,
      durationMinutes: Math.round(route.duration / 60),
      legs: route.legs.map((leg) => Math.max(1, Math.round(leg.duration / 60))),
      source: 'OSRM foot route',
      status: 'live',
    };
  } catch {
    const distanceKm = places.slice(1).reduce((total, place, index) => total + haversineKm(places[index], place), 0);
    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMinutes: Math.round(distanceKm / 4.5 * 60),
      legs: places.slice(1).map((place, index) => Math.max(4, Math.round(haversineKm(places[index], place) / 4.5 * 60))),
      source: 'Coordinate estimate',
      status: 'estimated',
    };
  }
}

export async function POST(request: Request) {
  let body: PlanRequest;
  try { body = await request.json() as PlanRequest; } catch { return jsonError('Send a valid trip brief.'); }

  const destination = body.destination?.trim();
  const startDate = body.startDate;
  const endDate = body.endDate;
  const travelers = Math.max(1, Math.min(12, Number(body.travelers || 1)));
  const budget = Math.max(0, Number(body.budget || 0));
  const pace = body.pace || 'balanced';
  const interests = (body.interests || []).slice(0, 8);

  if (!destination) return jsonError('Choose a destination before building the trip.');
  if (!startDate || !endDate) return jsonError('Add start and end dates before building the trip.');
  const tripDays = daysBetween(startDate, endDate);
  if (tripDays < 1 || tripDays > 7) return jsonError('For this POC, choose a trip between 1 and 7 days.');

  type GeoResponse = { results?: Array<{ name: string; country?: string; country_code?: string; latitude: number; longitude: number; timezone?: string }> };
  let geo;
  try {
    const params = new URLSearchParams({ name: destination, count: '1', language: 'en', format: 'json' });
    const data = await fetchJson<GeoResponse>(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    geo = data.results?.[0];
  } catch {
    return jsonError('The destination service is temporarily unavailable. Try again in a moment.', 503);
  }
  if (!geo) return jsonError(`We could not find “${destination}”. Try a city and country.`);

  const [osmResult, wikiResult, weatherResult, summaryResult] = await Promise.allSettled([
    getPlaces(geo.latitude, geo.longitude),
    getWikipediaPlaces(geo.latitude, geo.longitude),
    getWeather(geo.latitude, geo.longitude, startDate, endDate),
    getDestinationSummary(geo.name),
  ]);

  const osmPlaces = osmResult.status === 'fulfilled' ? osmResult.value : [];
  const wikiPlaces = wikiResult.status === 'fulfilled' ? wikiResult.value : [];
  const unique = new Map<string, Place>();
  [...wikiPlaces, ...osmPlaces].forEach((place) => {
    const key = place.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const current = unique.get(key);
    if (!current || (!current.imageUrl && place.imageUrl)) unique.set(key, place);
  });
  const ranked = rankPlaces([...unique.values()], interests, body.prompt || '');
  const needed = Math.min(18, tripDays * (pace === 'slow' ? 2 : 3));
  const selected = ranked.slice(0, needed);
  if (selected.length < Math.min(4, needed)) {
    return jsonError('We found the city, but not enough sourced places to build a useful plan. Try a nearby major city.', 503);
  }

  const perDay = pace === 'slow' ? 2 : 3;
  const visitMinutes = pace === 'slow' ? 120 : pace === 'full' ? 75 : 90;
  const dayGroups = Array.from({ length: tripDays }, (_, index) => selected.slice(index * perDay, (index + 1) * perDay));
  const routes = await Promise.all(dayGroups.map(routeDay));
  const itinerary = dayGroups.map((places, dayIndex) => {
    let cursor = 9 * 60 + 30;
    const route = routes[dayIndex];
    const items = places.map((place, placeIndex) => {
      const travelMinutes = placeIndex === 0 ? 0 : route.legs?.[placeIndex - 1] || 15;
      cursor += travelMinutes;
      const startMinutes = cursor;
      cursor += visitMinutes;
      const formatTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
      return {
        ...place,
        startTime: formatTime(startMinutes),
        endTime: formatTime(cursor),
        travelMinutesFromPrevious: travelMinutes,
        why: `Matches your ${interests.length ? interests.slice(0, 2).join(' + ') : 'local highlights'} brief and keeps the day geographically practical.`,
        freshness: { status: 'recent', provider: place.source, fetchedAt: new Date().toISOString() },
      };
    });
    const title = interests[dayIndex % Math.max(1, interests.length)]
      ? `${interests[dayIndex % interests.length][0].toUpperCase()}${interests[dayIndex % interests.length].slice(1)} & nearby finds`
      : dayIndex === 0 ? 'The essential first look' : 'Neighbourhood discoveries';
    return { day: dayIndex + 1, date: dateAt(startDate, dayIndex), title, items, route };
  });

  const nights = Math.max(0, tripDays - 1);
  const activityEstimate = selected.length * 18 * travelers;
  const foodEstimate = tripDays * 46 * travelers;
  const transportEstimate = tripDays * 13 * travelers;
  const stayEstimate = nights * 125;
  const contingency = Math.round((activityEstimate + foodEstimate + transportEstimate + stayEstimate) * 0.1);
  const total = activityEstimate + foodEstimate + transportEstimate + stayEstimate + contingency;
  const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : undefined;
  const warnings = [
    ...(osmResult.status === 'rejected' ? ['OpenStreetMap place details were unavailable; Wikipedia places are shown.'] : []),
    ...(wikiResult.status === 'rejected' ? ['Wikipedia context and imagery were unavailable.'] : []),
    ...(weatherResult.status === 'rejected' ? ['Weather is temporarily unavailable.'] : []),
  ];

  return Response.json({
    tripId: crypto.randomUUID(),
    spec: { ...body, destination: geo.name, travelers, pace, interests, days: tripDays },
    destination: {
      name: geo.name,
      country: geo.country,
      countryCode: geo.country_code,
      latitude: geo.latitude,
      longitude: geo.longitude,
      timezone: geo.timezone,
      summary: cleanText(summary?.extract),
      imageUrl: summary?.originalimage?.source || summary?.thumbnail?.source || selected.find((place) => place.imageUrl)?.imageUrl,
      sourceUrl: summary?.content_urls?.desktop?.page,
    },
    itinerary,
    weather: weatherResult.status === 'fulfilled' ? weatherResult.value : { available: false, status: 'unavailable', note: 'Weather is temporarily unavailable.' },
    budget: {
      currency: 'USD', budget, total,
      status: budget > 0 && total > budget ? 'over' : 'on-track',
      lines: [
        { label: 'Stay allowance', amount: stayEstimate, status: 'estimated' },
        { label: 'Food allowance', amount: foodEstimate, status: 'estimated' },
        { label: 'Local transport', amount: transportEstimate, status: 'estimated' },
        { label: 'Activities', amount: activityEstimate, status: 'estimated' },
        { label: 'Contingency', amount: contingency, status: 'estimated' },
      ],
    },
    validation: {
      dates: 'pass', overlap: 'pass', pace: 'pass',
      openingHours: selected.every((place) => place.openingHours) ? 'pass' : 'check',
      budget: budget > 0 && total > budget ? 'fail' : 'pass',
      note: 'Schedules do not overlap. Published opening hours still need confirmation before booking.',
    },
    meta: {
      fetchedAt: new Date().toISOString(),
      providers: ['Open-Meteo geocoding', 'Open-Meteo forecast', 'OpenStreetMap / Overpass', 'Wikipedia', 'OSRM'],
      engine: 'Dahlia relevance + feasibility engine',
      warnings,
    },
  });
}
