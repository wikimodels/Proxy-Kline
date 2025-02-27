export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

import { getFilteredCoinSymbols } from "../functions/get-filtered-coin-symbols";
import { binancePerpUrl } from "../functions/binance-perp-url";
import { bybitPerpUrl } from "../functions/bybit-perp-url";
import { convertIntervalToMs } from "../functions/convertIntervalToMs";
import { processBinanceKlineData } from "../functions/processBinanceKlineData";
import { processBybitKlineData } from "../functions/processBybitKlineData";

export default async function handler(request) {
  // =====================
  // 1. Validate Environment Variables
  // =====================
  const dataApiUrl = process.env.DATA_API_URL;
  const dataApiKey = process.env.DATA_API_KEY;

  if (!dataApiUrl || !dataApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing MongoDB Data API configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // =====================
  // 2. Fetch Data from MongoDB
  // =====================
  try {
    const mongoResponse = await fetch(`${dataApiUrl}/action/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": dataApiKey,
      },
      body: JSON.stringify({
        dataSource: "Cluster0",
        database: "general",
        collection: "coin-repo",
        filter: {},
      }),
    });

    if (!mongoResponse.ok) {
      const errorText = await mongoResponse.text();
      return new Response(
        JSON.stringify({
          error: "MongoDB request failed",
          details: errorText,
        }),
        { status: mongoResponse.status }
      );
    }

    const mongoData = await mongoResponse.json();
    const coins = mongoData.documents || [];

    // =====================
    // 3. Validate & Prepare Data
    // =====================
    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500 }
      );
    }

    // Create a lookup map for coin details by symbol
    const coinMap = coins.reduce((acc, coin) => {
      if (coin.symbol) {
        acc[coin.symbol] = coin;
      }
      return acc;
    }, {});

    // Get filtered symbols for Binance and Bybit
    const { binanceSymbols, bybitSymbols } = getFilteredCoinSymbols(coins);

    // =====================
    // 4. Define kline request parameters
    // =====================
    const binanceInterval = "5m";
    const bybitInterval = "5m";
    const limit = 100;

    // =====================
    // 5. Fetch and Process Kline Data concurrently using Promise.all
    // =====================
    const binanceKlinesPromises = binanceSymbols.map((symbol) => {
      const url = binancePerpUrl(symbol, binanceInterval, limit);
      return fetch(url).then((res) => res.json());
    });

    const bybitKlinesPromises = bybitSymbols.map((symbol) => {
      const url = bybitPerpUrl(symbol, bybitInterval, limit);
      return fetch(url).then((res) => res.json());
    });

    const [binanceKlines, bybitKlines] = await Promise.all([
      Promise.all(binanceKlinesPromises),
      Promise.all(bybitKlinesPromises),
    ]);

    // =====================
    // 6. Return Combined Response
    // =====================
    return new Response(
      JSON.stringify({
        binanceKlines,
        bybitKlines,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
