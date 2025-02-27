export const config = {
  runtime: "edge",
  regions: ["kix1"],
};

export default async function handler(request) {
  const url =
    "https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=5m&limit=1";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        Referer: "https://www.binance.com/",
        Origin: "https://www.binance.com",
      },
    });

    if (!res.ok) {
      // Read and log the response as text (this may contain the HTML error message)
      const errorText = await res.text();
      console.error("Error fetching Binance data:", errorText);
      return new Response(errorText, {
        status: res.status,
        headers: { "Content-Type": "text/plain" },
      });
    }

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
