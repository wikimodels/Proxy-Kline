function bybitPerpUrl(symbol, interval, limit, category) {
  const baseUrl = "https://api.bybit.com/v5/market/kline";
  return `${baseUrl}?category=${category}&symbol=${symbol}&interval=${interval}&limit=${limit}`;
}
module.exports = { bybitPerpUrl };
