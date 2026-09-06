export function briefSummary(brief: Record<string, unknown>) {
  const parts = [brief.destination ? `Trip to ${brief.destination}` : 'Let’s find your next destination'];
  if (brief.origin) parts.push(`from ${brief.origin}`);
  if (brief.durationDays) parts.push(`for ${brief.durationDays} days`);
  if (brief.startDate && brief.endDate) parts.push(`(${brief.startDate} to ${brief.endDate})`);
  const details: string[] = [];
  if (Number(brief.travelers) > 0) details.push(`${brief.travelers} traveler${brief.travelers === 1 ? '' : 's'}`);
  if (Number(brief.budget) > 0) details.push(`${brief.currency || 'USD'} ${brief.budget} budget`);
  if (Array.isArray(brief.interests) && brief.interests.length) details.push(`interests: ${brief.interests.join(', ')}`);
  return `${parts.join(' ')}.${details.length ? ` ${details.join(' · ')}.` : ''}`;
}
