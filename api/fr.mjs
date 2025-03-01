import { fetchBybitFr } from "../functions/bybit/fetch-bybit-fr.mjs";
import { fetchBingXFr } from "../functions/bingx/fetch-bingx-fr.mjs";
import { fetchCoins } from "../functions/fetch-coins.mjs";

export const config = {
  runtime: "edge",
  regions: ["arn1"],
};

export default async function handler(request) {
  try {
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

    const limit = 200;

    const [bybitData, bingXData] = await Promise.all([
      fetchBybitFr(bybitCoins, limit),
      fetchBingXFr(bingXCoins, limit),
    ]);

    const fundingRates = [...bybitData, ...bingXData];

    return new Response(JSON.stringify({ fundingRates }), {
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
