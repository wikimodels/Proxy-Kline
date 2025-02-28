export const config = {
  runtime: "edge", // Uses Vercel Edge for low latency
  regions: ["arn1"], // Adjust as needed
};

export default async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BTCUSDT"; // Default: BTCUSDT
    const interval = searchParams.get("interval") || "1h"; // Default: 1-hour
    const limit = searchParams.get("limit") || "100"; // Default: 100 candles

    if (!symbol) {
      return new Response(JSON.stringify({ error: "Symbol is required" }), {
        status: 400,
      });
    }

    const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data)) {
      return new Response(
        JSON.stringify({ error: "Invalid response from Binance" }),
        { status: 500 }
      );
    }

    // Format the response
    const klines = data.map((entry) => ({
      openTime: entry[0], // Timestamp
      open: parseFloat(entry[1]),
      high: parseFloat(entry[2]),
      low: parseFloat(entry[3]),
      close: parseFloat(entry[4]),
      volume: parseFloat(entry[5]),
      closeTime: entry[6], // Timestamp
      quoteAssetVolume: parseFloat(entry[7]),
      trades: entry[8],
      takerBuyBaseVolume: parseFloat(entry[9]),
      takerBuyQuoteVolume: parseFloat(entry[10]),
    }));

    return new Response(JSON.stringify({ symbol, klines }), {
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
