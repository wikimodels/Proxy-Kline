import { fetchCoinsFromRedis } from "../../functions/coins/fetch-coins-from-redis.mjs";
import { fetchBybitKlines } from "../../functions/bybit/fetch-bybit-klines.mjs";
import { fetchBingXKlines } from "../../functions/bingx/fetch-bingx-klines.mjs";
import { fetchBinanceKlines } from "../../functions/binance/fetch-binance-klines.mjs";

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  try {
    const timeframe = "m15";
    const limit = 200;

    const { bybitCoins, binanceCoins, bingXCoins } =
      await fetchCoinsFromRedis();

    const [bybitKlines, binanceKlines, bingXKlines] = await Promise.all([
      fetchBinanceKlines(binanceCoins, timeframe, limit),
      fetchBybitKlines(bybitCoins, timeframe, limit),
      fetchBingXKlines(bingXCoins, timeframe, limit),
    ]);

    return new Response(
      JSON.stringify({
        klines15min: [
          ...(bingXKlines ?? []),
          ...(bybitKlines ?? []),
          ...(binanceKlines ?? []),
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
}
