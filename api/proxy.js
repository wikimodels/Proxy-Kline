export const config = {
  runtime: "edge",
  regions: ["fra1"],
};
import { getFilteredCoins } from "../functions/get-filtered-coins";

export default async function handler(request) {
  // =====================
  // 1. Validate Environment Variables
  // =====================
  const redisUrl = process.env.KV_REST_API_URL?.endsWith("/")
    ? process.env.KV_REST_API_URL.slice(0, -1)
    : process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  const dataApiUrl = process.env.DATA_API_URL;
  const dataApiKey = process.env.DATA_API_KEY;

  if (!redisUrl || !redisToken) {
    return new Response(
      JSON.stringify({ error: "Missing Upstash Redis configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!dataApiUrl || !dataApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing MongoDB Data API configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // =====================
  // 2. Fetch Data from MongoDB
  // =====================
  try {
    const mongoResponse = await fetch(`${dataApiUrl}/action/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": dataApiKey,
      },
      body: JSON.stringify({
        dataSource: "Cluster0",
        database: "general",
        collection: "coin-repo",
        filter: {},
      }),
    });

    if (!mongoResponse.ok) {
      const errorText = await mongoResponse.text();
      return new Response(
        JSON.stringify({
          error: "MongoDB request failed",
          details: errorText,
        }),
        { status: mongoResponse.status }
      );
    }

    const mongoData = await mongoResponse.json();
    const coins = mongoData.documents || [];

    // =====================
    // 3. Validate & Prepare Data
    // =====================
    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500 }
      );
    }

    const { binanceCoins, bybtCoins } = getFilteredCoins(coins);
    const symbols = binanceCoins.map((c) => c.symbol);
    return new Response(JSON.stringify({ binanceCoins, symbols }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
