export function explicitCurrency(message: string, supported: string[]) {
  return [...message.toUpperCase().matchAll(/\b[A-Z]{3}\b/g)].map((match) => match[0]).filter((code) => supported.includes(code)).at(-1);
}

export function explicitTravelers(message: string) {
  const matches = [...message.matchAll(/\b(just me|solo|by myself|only me|alone|(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:people|persons|travelers|travellers|adults)|(?:party|group|family) of (?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve))\b/gi)];
  const text = matches.at(-1)?.[0].toLowerCase();
  if (!text) return undefined;
  if (/just me|solo|by myself|only me|alone/.test(text)) return 1;
  const words = ['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  const token = text.match(/\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve/)?.[0];
  return token && /^\d+$/.test(token) ? Number(token) : words.indexOf(token || '') + 1;
}
