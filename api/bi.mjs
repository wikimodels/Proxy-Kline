export const config = { runtime: "edge" };

export default async function handler(request: Request) {
  // Parse incoming request URL
  const targetUrl = `https://api.binance.com/api/v3/klines?symbol=ETHUSDT&interval=1h&limit=5`;

  // Clone and modify headers
  const headers = new Headers(request.headers);
  headers.set(
    "User-Agent",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  );
  headers.set("Accept", "*/*");
  headers.set("Accept-Language", "en-US,en;q=0.9");
  headers.set("Origin", "https://www.binance.com");
  headers.set("Referer", "https://www.binance.com/");

  // Remove headers that might reveal proxy
  headers.delete("x-vercel-id");
  headers.delete("x-vercel-ip-country");
  headers.delete("x-vercel-deployment-url");

  try {
    // Forward request to Binance
    const response = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      body: request.body,
    });

    // Create CORS-friendly response
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Proxy error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
