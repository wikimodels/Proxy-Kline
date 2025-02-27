// A helper function that splits coins into binanceCoins and bybtCoins
export function getFilteredCoins(coins) {
  const binanceCoins = coins.filter(
    (coin) => coin.exchanges && coin.exchanges.includes("Binance")
  );
  const bybitCoins = coins.filter(
    (coin) =>
      coin.exchanges &&
      coin.exchanges.includes("Bybit") &&
      !coin.exchanges.includes("Binance")
  );
  return { binanceCoins, bybitCoins };
}
