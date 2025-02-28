export function bybitOiUrl(symbol, interval, limit) {
  const baseUrl = "https://api.bybit.com/v5/market/open-interest";
  return `${baseUrl}?category=linear&symbol=${symbol}&intervalTime=${interval}&limit=${limit}`;
}
