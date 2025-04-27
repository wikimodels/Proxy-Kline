// /api/binance-proxy.mjs (for Edge Function)

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing 'url' query parameter", { status: 400 });
  }

  const fullUrl = `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&limit=5`;

  try {
    const binanceResponse = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
      },
    });

    const body = await binanceResponse.text();

    return new Response(body, {
      status: binanceResponse.status,
      headers: {
        "Content-Type":
          binanceResponse.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Proxy Error]", error);
    return new Response("Proxy Error", { status: 500 });
  }
}
