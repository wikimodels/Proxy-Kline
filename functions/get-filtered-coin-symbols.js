// A helper function that splits coins into binanceSymbols and bybitSymbols
export function getFilteredCoinSymbols(coins) {
  const binanceSymbols = coins
    .filter((coin) => coin.exchanges && coin.exchanges.includes("Binance"))
    .map((coin) => coin.symbol);

  const bybitSymbols = coins
    .filter(
      (coin) =>
        coin.exchanges &&
        coin.exchanges.includes("Bybit") &&
        !coin.exchanges.includes("Binance") &&
        coin.collection == "coin-repo"
    )
    .map((coin) => coin.symbol);

  return { binanceSymbols, bybitSymbols };
}
