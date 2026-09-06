let lastLookup = 0;
export async function POST(request: Request) {
  try {
    let { latitude, longitude } = await request.json().catch(() => ({})) as { latitude?: number; longitude?: number };
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      const ipResponse = await fetch('https://ipapi.co/json/', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(7000) });
      if (!ipResponse.ok) throw new Error();
      const ip = await ipResponse.json() as { latitude?: number; longitude?: number };
      latitude = ip.latitude; longitude = ip.longitude;
    }
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return Response.json({ error: 'Invalid coordinates.' }, { status: 400 });
    if (Date.now() - lastLookup < 1100) return Response.json({ error: 'Please wait before checking location again.' }, { status: 429 });
    lastLookup = Date.now();
    const params = new URLSearchParams({ lat: latitude.toFixed(2), lon: longitude.toFixed(2), format: 'jsonv2', zoom: '10', 'accept-language': 'en' });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: { 'User-Agent': 'DahliaTripPlanner/0.1 (city lookup)' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error();
    const data = await response.json() as { address?: { city?: string; town?: string; village?: string; country?: string } };
    const city = data.address?.city || data.address?.town || data.address?.village;
    if (!city) throw new Error();
    return Response.json({ city: [city, data.address?.country].filter(Boolean).join(', ') }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Could not find your city. Please type your starting city instead.' }, { status: 503 }); }
}
