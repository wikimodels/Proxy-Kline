export function bingXFrUrl(symbol, interval, limit) {
  return `https://open-api.bingx.com/openApi/swap/v2/quote/fundingRate?symbol=${symbol.replace(
    /(USDT)$/,
    "-$1"
  )}&interval=${interval}&limit=${limit}`;
}
