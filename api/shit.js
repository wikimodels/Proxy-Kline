// api/binance/route.js
export const config = {
  runtime: "edge",
  regions: ["hkg1"], // Hong Kong region (Binance-friendly)
};

export default async function handler(request) {
  const apiKey =
    "EdRGpmIPUePKACmDlPCyuq1MPKgXjXMSoRR18ngEtJRX6dbQggHLWv361JwlX4sB";
  // Debug log to verify API key (remove in production)
  console.log("Using API Key:", apiKey?.slice(0, 5) + "...");

  try {
    const params = new URLSearchParams({
      symbol: "BTCUSDT",
      interval: "5m",
      limit: "1",
    });

    // Use Binance's global endpoint
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?${params}`,
      {
        headers: {
          "X-MBX-APIKEY": apiKey,
          Accept: "application/json",
        },
      }
    );

    // Handle Binance's special error format
    if (!response.ok) {
      const errorData = await response.text();
      return new Response(
        { errorData },
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        open: data[0][1],
        high: data[0][2],
        low: data[0][3],
        close: data[0][4],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30", // 30s cache
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Network failure",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
