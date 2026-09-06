import { scheduleTimes } from './schedule.ts';

type Route = { durationMinutes: number; legs?: number[]; source: string; status: string };

export async function practicalDay<T, R extends Route>(places: T[], walking: R, routeByRoad: (places: T[]) => Promise<R>, visitMinutes: number, walkingLimit: number, startMinutes: number) {
  try {
    return { places, route: walking, times: scheduleTimes(places.length, walking.legs || [], visitMinutes, walkingLimit, startMinutes), note: '' };
  } catch { /* Check a sourced road transfer option before rejecting the day. */ }
  const road = await routeByRoad(places);
  // Road durations exclude parking/pickup, so reserve ten minutes per transfer.
  const legs = road.legs?.map((minutes) => minutes + 10) || [];
  const route = { ...road, legs, durationMinutes: legs.reduce((sum, minutes) => sum + minutes, 0), source: `${road.source} + pickup/parking buffers`, status: 'estimated' };
  return {
    places, route,
    times: scheduleTimes(places.length, legs, visitMinutes, 180, startMinutes),
    note: 'Long walks between visits were replaced with estimated car/taxi transfers, including pickup/parking buffers. Fares are not quoted. Hiking visits still require separate trail and ability checks.',
  };
}
