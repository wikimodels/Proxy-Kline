export const config = {
  runtime: "edge",
  regions: ["fra1"], // Choose one or more allowed regions: cdg1, arn1, dub1, lhr1, iad1, sfo1, pdx1, cle1, gru1, hkg1, hnd1, icn1, kix1, sin1, bom1, syd1, fra1, cpt1, dxb1.
};

export default async function handler(request) {
  // Binance endpoint for kline data: BTCUSDT, 5m interval, limit 1.
  const url =
    "https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=5m&limit=1";

  try {
    const res = await fetch(url);

    // If the response status is not OK, read and return the error text (which might be HTML).
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error fetching Binance data:", errorText);
      return new Response(errorText, {
        status: res.status,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Parse the response as JSON and return it.
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Unexpected error: " + error.message, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
