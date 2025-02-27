export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(req) {
  try {
    // Extract query parameters from the request
    const {
      symbol = "BTC-USDT",
      interval = "1h",
      limit = 10,
    } = Object.fromEntries(new URL(req.url).searchParams);

    // Construct API URL
    const url = `https://open-api.bingx.com/openApi/swap/v3/quote/klines?symbol=BTC-USDT&interval=5m&limit=1`;

    // Fetch data from BingX
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `BingX API request failed with status ${response.status}`
      );
    }

    const data = (await response.json()).data;
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid or empty response from BingX");
    }

    // Map response to match your expected format
    const klineData = data.map((entry) => ({
      openTime: Number(entry.time),
      closeTime: Number(entry.time) + getIntervalDurationMs("5m"), // Calculate close time
      openPrice: Number(entry.open),
      highPrice: Number(entry.high),
      lowPrice: Number(entry.low),
      closePrice: Number(entry.close),
      baseVolume: Number(entry.volume),
      symbol,
      exchange: "BingX",
    }));

    return new Response(JSON.stringify({ symbol, klineData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

// Helper function to get interval duration in milliseconds
function getIntervalDurationMs(interval) {
  const timeframes = {
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "30m": 1800000,
    "1h": 3600000,
    "4h": 14400000,
    "1d": 86400000,
  };

  return timeframes[interval] || 0;
}
