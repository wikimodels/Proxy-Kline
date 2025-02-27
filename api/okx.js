export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const instId = searchParams.get("instId") || "BTC-USDT";
  const bar = searchParams.get("bar") || "5m";
  const limit = searchParams.get("limit") || "1";

  try {
    const url = `https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`;
    console.log(`Fetching: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data || !Array.isArray(data.data)) {
      throw new Error("Invalid response structure from OKX");
    }

    const klineData = data.data.map((entry) => ({
      openTime: Number(entry[0]),
      openPrice: Number(entry[1]),
      highPrice: Number(entry[2]),
      lowPrice: Number(entry[3]),
      closePrice: Number(entry[4]),
      baseVolume: Number(entry[5]),
      quoteVolume: Number(entry[6] || 0), // OKX response may not include quoteVolume
    }));

    return new Response(JSON.stringify({ symbol: instId, klineData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
