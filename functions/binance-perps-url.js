export function binancePerpUrl(symbol, interval, limit) {
  const baseUrl = "https://fapi.binance.com";
  return `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
}
