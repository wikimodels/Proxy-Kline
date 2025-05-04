import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
import { fetchBybitKlinesBySymbol } from "../../functions/bybit/fetch-bybit-klines-by-symbol.mjs";
import { fetchBingXKlinesBySymbol } from "../../functions/bingx/fetch-bingx-klines-by-symbol.mjs";
import { fetchBinanceKlinesBySymbol } from "../../functions/binance/fetch-binance-klines-by-symbol.mjs";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const timeframe = searchParams.get("timeframe");
    const limit = parseInt(searchParams.get("limit"), 10) || 100;
    console.log("symbol", symbol);
    console.log("timeframe", timeframe);
    console.log("limit", limit);

    if (!symbol || !timeframe) {
      return new Response(
        JSON.stringify({
          error: "Missing symbol or timeframe query parameters",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { bybitCoins, binanceCoins, bingXCoins } =
      await fetchCoinsFromRedis();

    const coin = [...bybitCoins, ...binanceCoins, ...bingXCoins].find(
      (c) => c.symbol.toUpperCase() === symbol.toUpperCase()
    );

    if (!coin) {
      return new Response(
        JSON.stringify({ error: `Coin with symbol ${symbol} not found` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    let klineData = [];

    if (coin.exchanges.includes("Bybit")) {
      klineData = await fetchBybitKlinesBySymbol(coin, timeframe, limit);
    } else if (
      coin.exchanges.includes("Binace") ||
      !coin.exchanges.includes("Bybit") ||
      !coin.exchanges.includes("BingX PF")
    ) {
      klineData = await fetchBinanceKlinesBySymbol(coin, timeframe, limit);
    } else if (
      (coin.exchanges.includes("BingX SF") ||
        !coin.exchanges.includes("Binace")) &&
      !coin.exchanges.includes("Bybit")
    ) {
      klineData = await fetchBingXKlinesBySymbol(coin, timeframe, limit);
    } else {
      return new Response(
        JSON.stringify({ error: `No supported exchange found for ${symbol}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        symbol: symbol.toUpperCase(),
        timeframe,
        data: klineData,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
