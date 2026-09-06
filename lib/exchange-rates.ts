type Rates = { result: string; base_code: string; rates: Record<string, number>; time_last_update_unix: number };
let cached: { data: Rates; expires: number } | undefined;
let pending: Promise<Rates> | undefined;

export async function usdExchangeRate(currency: string) {
  if (currency === 'USD') return 1;
  if (!cached || cached.expires <= Date.now()) {
    pending ??= fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(12000) })
      .then(async (response) => {
        if (!response.ok) throw new Error('Exchange provider unavailable');
        const data = await response.json() as Rates;
        if (data.result !== 'success' || data.base_code !== 'USD' || !data.rates || !Number.isFinite(data.time_last_update_unix) || Date.now() - data.time_last_update_unix * 1000 > 3 * 86400000) throw new Error('Exchange rates unavailable or outdated');
        cached = { data, expires: Date.now() + 3600000 };
        return data;
      }).finally(() => { pending = undefined; });
    await pending;
  }
  const rate = cached?.data.rates[currency];
  if (!rate || !Number.isFinite(rate) || rate <= 0) throw new Error('Currency rate unavailable');
  return rate;
}
