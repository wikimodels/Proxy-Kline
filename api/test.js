export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  const url =
    "https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=5m&limit=1";
  try {
    const res = await fetch(url);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
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
