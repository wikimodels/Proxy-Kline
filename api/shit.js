// api/binance.js (Vercel Serverless Function)

export default async function handler(req, res) {
  // 1. Get API key from environment
  const apiKey =
    "EdRGpmIPUePKACmDlPCyuq1MPKgXjXMSoRR18ngEtJRX6dbQggHLWv361JwlX4sB";

  if (!apiKey) {
    return res.status(500).json({ error: "Binance API key not configured" });
  }

  // 2. Basic parameters
  const params = new URLSearchParams({
    symbol: "BTCUSDT",
    interval: "5m",
    limit: "1",
  });

  try {
    // 3. Use MAIN Binance API endpoint (not futures)
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?${params}`,
      {
        headers: {
          "X-MBX-APIKEY": apiKey,
          "User-Agent": "Node/18", // Simple but effective UA
        },
      }
    );

    // 4. Handle response
    if (!response.ok) {
      const error = await response.json();
      return res.status(400).json({
        error: `Binance API error: ${error.msg}`,
        code: error.code,
      });
    }

    // 5. Return clean data
    const data = await response.json();
    return res.status(200).json({
      open: data[0][1],
      high: data[0][2],
      low: data[0][3],
      close: data[0][4],
    });
  } catch (error) {
    return res.status(500).json({
      error: "Network error",
      details: error.message,
    });
  }
}
