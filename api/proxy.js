// api/proxy.js

export const config = {
  runtime: "edge",
  regions: ["fra1"], // Change this to a region allowed by Bybit if needed
};

export default async function handler(request) {
  const bybitUrl =
    "https://api.bybit.com/v5/market/kline?category=linear&symbol=BTCUSDT&interval=15&limit=200";
  console.log("Fetching Bybit URL:", bybitUrl);
  try {
    const response = await fetch(bybitUrl);
    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Fetched data:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Error fetching data from Bybit",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
