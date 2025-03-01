import { fetchBybitOi } from "../functions/bybit/fetch-bybit-oi.mjs";
import { fetchCoins } from "../functions/fetch-coins.mjs";
import { fetchBingXOi } from "../functions/bingx/fetch-bingx-oi.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
    const timeframe = "h1";
    const limit = 2;
    const coins = await fetchCoins();

    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500 }
      );
    }

    const bybitCoins = coins
      .filter((c) => c.exchanges.includes("Bybit"))
      .slice(0, 2);

    const bingXCoins = coins.filter(
      (c) => !c.exchanges.includes("Bybit") && c.exchanges.includes("BingX PF")
    );

    const bybitData = await fetchBybitOi(bybitCoins, timeframe, limit);

    if (!bybitData?.[0]?.klineData?.length) {
      return new Response(
        JSON.stringify({ error: "No valid kline data from Bybit" }),
        { status: 500 }
      );
    }

    const lastKline = bybitData[0].klineData[bybitData[0].klineData.length - 1];
    const openTime = lastKline.openTime;
    const closeTime = lastKline.closeTime;

    let bingXData = await fetchBingXOi(bingXCoins);

    if (!Array.isArray(bingXData)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from BingX" }),
        { status: 500 }
      );
    }

    // ✅ Correctly transform `bingXData`
    bingXData = bingXData.map((d) => ({
      symbol: d.symbol,
      category: d.category,
      exchanges: d.exchanges,
      openTime: openTime,
      closeTime: closeTime,
      openInterest: d.klineData?.openInterest || 0,
    }));

    console.log(bingXData[0]);

    return new Response(JSON.stringify({ bingXData, bybitData }), {
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
