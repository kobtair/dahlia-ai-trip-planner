type TripBrief = Record<string, unknown>;

export type TripAssumption = {
  field: string;
  value: unknown;
  askCount: number;
};

const DAY_MS = 86_400_000;

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function addDays(date: string, days: number) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

function nextFriday(today: string) {
  const date = new Date(`${today}T12:00:00Z`);
  const distance = (5 - date.getUTCDay() + 7) % 7;
  return addDays(today, distance || 7);
}

export function completeTripBrief(input: TripBrief, message: string, today: string) {
  const brief: TripBrief = { ...input };
  const assumedFields: string[] = [];
  const assume = (field: string, value: unknown) => {
    brief[field] = value;
    assumedFields.push(field);
  };

  const destination = typeof brief.destination === 'string' ? brief.destination.trim() : '';
  if (!Number.isInteger(brief.durationDays) || Number(brief.durationDays) < 1 || Number(brief.durationDays) > 7) {
    const explicitRangeDays = validDate(brief.startDate) && validDate(brief.endDate)
      ? Math.floor((Date.parse(brief.endDate) - Date.parse(brief.startDate)) / DAY_MS) + 1
      : 0;
    if (explicitRangeDays >= 1 && explicitRangeDays <= 7) brief.durationDays = explicitRangeDays;
    else assume('durationDays', /\blong weekend\b/i.test(message) ? 3 : /\bweekend\b/i.test(message) ? 2 : 3);
  }

  if (!brief.origin && destination) assume('origin', destination);

  if (!validDate(brief.startDate)) {
    const flexibleWeekend = /\b(?:any|random|next|a)\b[^.]{0,30}\b(?:long )?weekend\b|\b(?:long )?weekend\b/i.test(message);
    assume('startDate', flexibleWeekend ? nextFriday(today) : addDays(today, 14));
  }
  if (!validDate(brief.endDate) || Date.parse(String(brief.endDate)) < Date.parse(String(brief.startDate))) {
    brief.endDate = addDays(String(brief.startDate), Number(brief.durationDays) - 1);
  }

  if (!Number.isInteger(brief.travelers) || Number(brief.travelers) < 1 || Number(brief.travelers) > 12) assume('travelers', 1);
  brief.travelersConfirmed = true;
  if (typeof brief.budget !== 'number' || !Number.isFinite(brief.budget) || Number(brief.budget) < 0) assume('budget', 0);
  if (typeof brief.currency !== 'string' || !brief.currency) assume('currency', 'USD');
  if (!['slow', 'balanced', 'full'].includes(String(brief.pace))) assume('pace', 'balanced');
  if (!Array.isArray(brief.interests)) brief.interests = [];
  if (!['city', 'country', 'region'].includes(String(brief.destinationScope))) brief.destinationScope = 'city';

  return { brief, assumedFields };
}

export function assumptionSummary(brief: TripBrief, assumedFields: string[]) {
  const assumed = new Set(assumedFields);
  const details: string[] = [];
  if (assumed.has('durationDays')) details.push(`${brief.durationDays} days`);
  if (assumed.has('startDate')) details.push(readableDateRange(brief.startDate, brief.endDate));
  if (assumed.has('origin')) details.push(`a local start in ${brief.origin}`);
  if (assumed.has('travelers')) details.push('1 traveler');
  if (assumed.has('pace')) details.push('a balanced pace');
  if (assumed.has('budget')) details.push('no fixed budget');
  if (assumed.has('currency')) details.push(`${brief.currency} estimates`);
  return details;
}

function naturalList(items: string[]) {
  if (items.length < 2) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function readableDateRange(start: unknown, end: unknown) {
  if (!validDate(start) || !validDate(end)) return String(start || end || 'the proposed dates');
  const first = new Date(`${start}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);
  const month = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(first);
  if (first.getUTCFullYear() === last.getUTCFullYear() && first.getUTCMonth() === last.getUTCMonth()) {
    return `${month} ${first.getUTCDate()}–${last.getUTCDate()}, ${last.getUTCFullYear()}`;
  }
  const format = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${format.format(first)}–${format.format(last)}`;
}

function confirmationDetails(brief: TripBrief, assumptions: TripAssumption[]) {
  const fields = new Set(assumptions.map((item) => item.field));
  const details: string[] = [];
  if (fields.has('durationDays') && !fields.has('startDate')) details.push(`${brief.durationDays} days`);
  if (fields.has('startDate')) details.push(readableDateRange(brief.startDate, brief.endDate));
  if (fields.has('origin')) details.push(`a local start in ${brief.origin}`);
  if (fields.has('travelers')) details.push(`${brief.travelers} traveler${Number(brief.travelers) === 1 ? '' : 's'}`);
  if (fields.has('budget')) details.push(Number(brief.budget) > 0 ? `${brief.currency || 'USD'} ${brief.budget} budget` : 'no fixed budget');
  if (fields.has('currency')) details.push(`${brief.currency} estimates`);
  if (fields.has('pace')) details.push(`a ${brief.pace} pace`);
  return details;
}

export function reconcileAssumptions({
  previous,
  previousBrief,
  nextBrief,
  newlyAssumedFields,
  message,
}: {
  previous: TripAssumption[];
  previousBrief: TripBrief;
  nextBrief: TripBrief;
  newlyAssumedFields: string[];
  message: string;
}) {
  const affirmative = /^(?:yes|yep|yeah|correct|right|okay|ok|fine|looks good|sounds good|that(?:'s| is) fine)\b/i.test(message.trim()) &&
    !/\b(?:but|except|actually|however|no)\b/i.test(message);
  const assumptions = affirmative ? [] : previous.filter((item) => Object.is(previousBrief[item.field], nextBrief[item.field]));
  for (const field of newlyAssumedFields) {
    if (!assumptions.some((item) => item.field === field)) assumptions.push({ field, value: nextBrief[field], askCount: 0 });
  }
  const askable = assumptions.filter((item) => item.askCount < 2);
  if (!askable.length) return { assumptions, question: null };
  for (const item of askable) item.askCount += 1;
  const details = confirmationDetails(nextBrief, askable);
  return {
    assumptions,
    question: `I assumed ${naturalList(details)}. Is that right? If not, tell me what to change.`,
  };
}
