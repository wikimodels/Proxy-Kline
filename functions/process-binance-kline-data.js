import { getFilteredCoinSymbols } from "../functions/get-filtered-coin-symbols";
import { binancePerpUrl } from "../functions/binance-perp-url";
import { bybitPerpUrl } from "../functions/bybit-perp-url";

// Helper: Convert interval string (e.g. "1m", "1h") to milliseconds
export function convertIntervalToMs(interval) {
  const unit = interval.slice(-1);
  const amount = Number(interval.slice(0, -1));
  switch (unit) {
    case "m":
      return amount * 60000;
    case "h":
      return amount * 3600000;
    case "d":
      return amount * 86400000;
    default:
      return amount * 60000;
  }
}

// Helper: Calculate close time given the open time and interval in ms
export function calculateCloseTime(openTime, intervalMs) {
  return openTime + intervalMs;
}

// Process Binance kline data assuming each entry has at least 12 elements
export function processBinanceKlineData(data, symbol, coin, intervalMs) {
  if (!Array.isArray(data)) {
    throw new Error(`Invalid Binance response structure for ${symbol}`);
  }
  const klineData = data
    .map((entry) => {
      try {
        if (!Array.isArray(entry) || entry.length < 12) {
          throw new Error("Invalid kline structure");
        }
        return {
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
          quoteVolume: Number(entry[7]),
        };
      } catch (entryError) {
        console.warn(
          `Skipping invalid Binance entry for ${symbol}:`,
          entryError
        );
        return null;
      }
    })
    .filter((entry) => entry !== null);

  // Remove the last element if the array is not empty
  if (klineData.length > 0) {
    klineData.pop();
  }
  return klineData;
}

// Process Bybit kline data using the provided structure
export function processBybitKlineData(data, symbol, coin, intervalMs) {
  if (!data?.result?.list || !Array.isArray(data.result.list)) {
    throw new Error(`Invalid response structure for ${symbol}`);
  }
  const rawEntries = data.result.list;
  const klineData = [];

  for (const entry of rawEntries) {
    try {
      if (!Array.isArray(entry) || entry.length < 7) {
        throw new Error("Invalid entry structure");
      }
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
    } catch (entryError) {
      console.warn(`Skipping invalid Bybit entry for ${symbol}:`, entryError);
    }
  }

  if (klineData.length > 0) {
    klineData.reverse();
    klineData.pop(); // Remove the last element only if array is not empty
  }
  return klineData;
}

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  // =====================
  // 1. Validate Environment Variables
  // =====================
  const redisUrl = process.env.KV_REST_API_URL?.endsWith("/")
    ? process.env.KV_REST_API_URL.slice(0, -1)
    : process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  const dataApiUrl = process.env.DATA_API_URL;
  const dataApiKey = process.env.DATA_API_KEY;

  if (!redisUrl || !redisToken) {
    return new Response(
      JSON.stringify({ error: "Missing Upstash Redis configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

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

    // Create a map for coin details keyed by symbol for later lookup
    const coinMap = coins.reduce((acc, coin) => {
      if (coin.symbol) {
        acc[coin.symbol] = coin;
      }
      return acc;
    }, {});

    // =====================
    // 4. Filter and Extract Symbols
    // =====================
    const { binanceSymbols, bybitSymbols } = getFilteredCoinSymbols(coins);

    // =====================
    // 5. Define kline request parameters
    // =====================
    const interval = "1m"; // Example interval (adjust as needed)
    const limit = 100;
    const intervalMs = convertIntervalToMs(interval);

    // =====================
    // 6. Fetch and Process Kline Data concurrently using Promise.all
    // =====================

    // For Binance: fetch and process each symbol's kline data
    const binanceKlinesPromises = binanceSymbols.map((symbol) => {
      const url = binancePerpUrl(symbol, interval, limit);
      return fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const coin = coinMap[symbol] || {};
          return processBinanceKlineData(data, symbol, coin, intervalMs);
        });
    });

    // For Bybit: fetch and process each symbol's kline data
    const bybitKlinesPromises = bybitSymbols.map((symbol) => {
      const url = bybitPerpUrl(symbol, interval, limit);
      return fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const coin = coinMap[symbol] || {};
          return processBybitKlineData(data, symbol, coin, intervalMs);
        });
    });

    const [binanceKlines, bybitKlines] = await Promise.all([
      Promise.all(binanceKlinesPromises),
      Promise.all(bybitKlinesPromises),
    ]);

    // =====================
    // 7. Return Combined Response
    // =====================
    return new Response(
      JSON.stringify({
        binanceSymbols,
        bybitSymbols,
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
