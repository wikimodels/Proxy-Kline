export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

import { getFilteredCoinSymbols } from "../functions/get-filtered-coin-symbols";

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
        filter: { collection: "coin-repo" },
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

    // Get filtered symbols for Binance and Bybit
    const { binanceSymbols, bybitSymbols } = getFilteredCoinSymbols(coins);

    // =====================
    // 4. Define kline request parameters
    // =====================
    const binanceInterval = "5m";
    const bybitInterval = "5";
    const limit = 1;

    // =====================
    // 5. Fetch and Process Kline Data concurrently using Promise.all
    // =====================
    const binanceKlinesPromises = binanceSymbols.map((symbol) => {
      const url = binancePerpUrl(symbol, binanceInterval, limit);
      return fetch(url).then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Error for ${symbol}:`, errorText);
          throw new Error(`HTTP error ${res.status} for ${symbol}`);
        }
        return res.json();
      });
    });

    const bybitKlinesPromises = bybitSymbols.map((symbol) => {
      const url = bybitPerpUrl(symbol, bybitInterval, limit);
      console.log(url);
      return fetch(url).then((res) => res.json());
    });

    const binanceKlines = await Promise.all(binanceKlinesPromises);
    // const bybitKlines = await Promise.all(bybitKlinesPromises);
    // const [binanceKlines, bybitKlines] = await Promise.all([
    //   Promise.all(binanceKlinesPromises),
    //   Promise.all(bybitKlinesPromises),
    // ]);

    // =====================
    // 6. Return Combined Response
    // =====================
    return new Response(
      JSON.stringify({
        binanceKlines,
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
function bybitPerpUrl(symbol, interval, limit) {
  const baseUrl = "https://api.bybit.com/v5/market/kline";
  return `${baseUrl}?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
}

function binancePerpUrl(symbol, interval, limit) {
  const baseUrl = "https://fapi.binance.com";
  return `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
}
