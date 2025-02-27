export const config = {
  runtime: "edge",
  regions: ["kix1"],
};

export default async function handler(request) {
  // Use environment variables for the API key if needed:
  const apiKey = process.env.BINANCE_API_KEY; // for example
  const params = new URLSearchParams({
    symbol: "BTCUSDT",
    interval: "5m",
    limit: "1",
  });

  // Choose the endpoint depending on what data you need:
  // For Spot:
  // const endpoint = `https://api.binance.com/api/v3/klines?${params}`;
  // For Futures, uncomment the next line:
  const endpoint = `https://fapi.binance.com/fapi/v1/klines?${params}`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        // Use a realistic user-agent if necessary:
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        // If using API key from an env variable:
        "X-MBX-APIKEY":
          "EdRGpmIPUePKACmDlPCyuq1MPKgXjXMSoRR18ngEtJRX6dbQggHLWv361JwlX4sB",
      },
    });

    if (!res.ok) {
      // Try reading as text since the error might not be JSON
      const errorText = await res.text();
      console.error("Error fetching Binance data:", errorText);
      throw new Error(`Binance API Error: ${errorText}`);
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Binance-Request-Weight": res.headers.get("x-mbx-used-weight") || "",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
