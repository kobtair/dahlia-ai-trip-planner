export function briefReady(brief: Record<string, unknown>, questions: string[]) {
  if (questions.length || typeof brief.destination !== 'string' || !brief.destination.trim()) return false;
  if (typeof brief.origin !== 'string' || !brief.origin.trim()) return false;
  if (!Number.isInteger(brief.travelers) || Number(brief.travelers) < 1 || Number(brief.travelers) > 12) return false;
  const dates = [brief.startDate, brief.endDate];
  if (dates.some((value) => typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) return false;
  const days = (Date.parse(String(brief.endDate)) - Date.parse(String(brief.startDate))) / 86400000 + 1;
  return days >= 1 && days <= 7;
}
