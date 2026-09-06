export function inclusiveEndDate(start: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !Number.isFinite(Date.parse(start)) || new Date(start).toISOString().slice(0, 10) !== start || !Number.isInteger(days) || days < 1 || days > 7) throw new Error('Choose valid dates for a 1–7 day trip.');
  return new Date(Date.parse(start) + (days - 1) * 86400000).toISOString().slice(0, 10);
}

export function dayCapacity(remaining: number, daysLeft: number, perDay: number) {
  if (remaining < daysLeft) throw new Error('Not enough suitable sourced places to cover every requested day. Try another base or adjust your interests.');
  return Math.min(perDay, Math.ceil(remaining / daysLeft));
}

export function scheduleTimes(count: number, legs: number[], visitMinutes: number, travelLimit: number) {
  let cursor = 570; // 09:30 destination local time; never a UTC timestamp.
  let totalTravel = 0;
  const time = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  return Array.from({ length: count }, (_, index) => {
    const travel = index === 0 ? 0 : legs[index - 1];
    if (!Number.isFinite(travel) || travel < 0) throw new Error('A transfer time could not be verified. Please rebuild this trip.');
    totalTravel += travel;
    cursor += travel;
    if (totalTravel > travelLimit || cursor + visitMinutes > 18 * 60) throw new Error('These places cannot fit into a practical walking day. Choose a closer base or different activities; long transfers are not supported yet.');
    const startTime = time(cursor);
    cursor += visitMinutes;
    return { startTime, endTime: time(cursor), travelMinutesFromPrevious: travel };
  });
}
