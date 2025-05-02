export const config = {
  runtime: "edge",
  regions: ["cdg1"],
};

export default async function handler(request) {
  // Hardcoded test URL
  const targetUrl = new URL("https://api.binance.com/api/v3/klines");
  targetUrl.searchParams.set("symbol", "BTCUSDT");
  targetUrl.searchParams.set("interval", "1h");
  targetUrl.searchParams.set("limit", "5");

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

  // Remove Vercel identifiers
  ["x-vercel-id", "x-vercel-ip-country", "x-vercel-deployment-url"].forEach(
    (h) => headers.delete(h)
  );

  try {
    const response = await fetch(targetUrl, {
      method: "GET", // Force GET for testing
      headers,
    });

    // Log response status for debugging
    console.log(`Response status: ${response.status}`);

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Proxy error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
