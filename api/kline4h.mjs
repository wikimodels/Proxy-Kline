import { fetchBybitKlines } from "../functions/bybit/fetch-bybit-klines.mjs";
import { fetchBingXKlines } from "../functions/bingx/fetch-bingx-klines.mjs";
import { fetchCoins } from "../functions/fetch-coins.mjs";

export const config = {
  runtime: "edge",
  regions: ["dub1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h4";
    const limit = 200;

    const coins = await fetchCoins();

    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500 }
      );
    }

    const bybitCoins = coins.filter((c) => c.exchanges.includes("Bybit"));

    const bingXCoins = coins.filter(
      (c) => !c.exchanges.includes("Bybit") && c.exchanges.includes("BingX PF")
    );

    const [bybitKlines, bingXKlines] = await Promise.all([
      fetchBybitKlines(bybitCoins, timeframe, limit),
      fetchBingXKlines(bingXCoins, timeframe, limit),
    ]);

    return new Response(JSON.stringify({ bingXKlines, bybitKlines }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: error.message }),
      { status: 500 }
    );
  }
}
