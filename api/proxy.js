export const config = {
  runtime: "edge",
  regions: ["dxb1"],
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
        filter: {}, // Fixed: Removed unnecessary filter
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
    const coins = (mongoData.documents || []).map((doc) => ({
      symbol: doc.symbol || "unknown",
      category: doc.category || "unknown",
      exchanges: Array.isArray(doc.exchanges) ? doc.exchanges : [],
    }));

    // =====================
    // 3. Validate & Prepare Data
    // =====================
    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500 }
      );
    }

    // =====================
    // 4. Define kline request parameters
    // =====================

    const timeframe = "m5";
    const limit = 1;

    // =====================
    // 5. Fetch and Process Kline Data concurrently using Promise.all
    // =====================

    // Fetch Bybit klines
    const bybitKlines = await fetchBybitKlines(coins, timeframe);

    // =====================
    // 6. Return Combined Response
    // =====================
    return new Response(
      JSON.stringify({
        binanceKlines: await Promise.all(binanceKlinesPromises), // Fixed: Now awaited
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

// ==========================
// Helper Functions
// ==========================

function bybitPerpUrl(symbol, interval, limit) {
  const baseUrl = "https://api.bybit.com/v5/market/kline";
  return `${baseUrl}?category=linear&symbol=${symbol}&interval=${interval}&limit=${limit}`;
}

function binancePerpUrl(symbol, interval, limit) {
  const baseUrl = "https://fapi.binance.com";
  return `${baseUrl}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
}

export function getIntervalDurationMs(tf) {
  const timeframes = {
    m1: 59999,
    m5: 299999,
    m15: 899999,
    m30: 1799999,
    h1: 3599999,
    h2: 7199999,
    h4: 14399999,
    h6: 21599999,
    h8: 28799999,
    h12: 43199999,
    D: 86399999,
  };

  if (!(tf in timeframes)) {
    throw new Error(`Unsupported timeframe: ${tf}`);
  }

  return timeframes[tf];
}

export function calculateCloseTime(openTime, intervalMs) {
  return openTime + intervalMs;
}

// ==========================
// Bybit Klines Fetcher
// ==========================
async function fetchBybitKlines(coins, timeframe, limit) {
  const intervalMs = getIntervalDurationMs(timeframe);
  const bybitInterval = getBybitInterval(timeframe);
  const bybitKlinesPromises = bybitSymbols.map(async (symbol) => {
    try {
      const url = bybitPerpUrl(symbol, bybitInterval, limit);
      console.log(`Fetching: ${url}`);

      const response = await fetch(url);
      const data = await response.json();

      if (!data?.result?.list || !Array.isArray(data.result.list)) {
        throw new Error(`Invalid response structure for ${symbol}`);
      }

      const rawEntries = data.result.list;
      const klineData = [];
      const coin = coins.find((c) => c.symbol === symbol) || {
        category: "unknown",
        exchanges: [],
      };

      for (const entry of rawEntries) {
        if (!Array.isArray(entry)) continue;
        klineData.push({
          openTime: Number(entry[0]),
          closeTime: calculateCloseTime(Number(entry[0]), intervalMs),
          symbol,
          category: coin.category,
          exchanges: coin.exchanges,
          openPrice: Number(entry[1]),
          highPrice: Number(entry[2]),
          lowPrice: Number(entry[3]),
          closePrice: Number(entry[4]),
          baseVolume: Number(entry[5]),
          quoteVolume: Number(entry[6]),
        });
      }

      return { symbol, klineData };
    } catch (error) {
      console.error(`Error processing ${symbol}:`, error);
      return { symbol, klineData: [] };
    }
  });

  return Promise.all(bybitKlinesPromises);
}

function getBybitInterval(timeframe) {
  const timeframes = {
    m1: "1",
    m5: "5",
    m15: "15",
    m30: "30",
    h1: "60",
    h2: "120",
    h4: "240",
    h6: "360",
    h8: "480",
    h12: "720",
    D: "D",
  };

  if (!(timeframe in timeframes)) {
    throw new Error(`Unsupported timeframe: ${timeframe}`);
  }

  return timeframes[timeframe];
}
