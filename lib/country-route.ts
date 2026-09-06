export function wantsCountryRoute(message: string, scope?: string) {
  return scope === 'country' && /\b(no base|entire country|whole country|country[- ]wide|all of)\b/i.test(message);
}
