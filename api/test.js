export const config = {
  runtime: "edge",
  regions: ["kix1"],
};

export default async function handler(request) {
  const params = new URLSearchParams({
    symbol: "BTCUSDT",
    interval: "5m",
    limit: "1",
  });

  try {
    const res = await fetch(`https://api.binance.com/api/v3/klines?${params}`, {
      headers: {
        "X-MBX-APIKEY":
          "EdRGpmIPUePKACmDlPCyuq1MPKgXjXMSoRR18ngEtJRX6dbQggHLWv361JwlX4sB",
        "User-Agent": "MyApp/1.0.0", // Identify your service
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Binance API Error: ${errorData.msg}`);
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Binance-Request-Weight": res.headers.get("x-mbx-used-weight"),
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
// BINANCE_API_KEY = "EdRGpmIPUePKACmDlPCyuq1MPKgXjXMSoRR18ngEtJRX6dbQggHLWv361JwlX4sB"
