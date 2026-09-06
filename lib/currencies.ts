export const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'SAR', 'AZN', 'INR', 'BDT', 'LKR', 'NPR', 'CAD', 'AUD', 'NZD', 'JPY', 'CHF', 'CNY', 'HKD', 'SGD', 'MYR', 'THB', 'IDR', 'PHP', 'KRW', 'TRY', 'QAR', 'KWD', 'BHD', 'OMR', 'EGP', 'ZAR', 'BRL', 'MXN', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON'];

export function currencyLabel(code: string) {
  return `${code} · ${new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || code}`;
}
