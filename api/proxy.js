// api/get-coins.js

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

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
    // 3. Validate & Prepare Redis Data
    // =====================
    if (!Array.isArray(coins)) {
      return new Response(
        JSON.stringify({ error: "Invalid data format from MongoDB" }),
        { status: 500 }
      );
    }

    // Safely serialize data (handle circular references)
    let redisValue;
    try {
      redisValue = JSON.stringify(coins);
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Data serialization failed",
          details: e.message,
        }),
        { status: 500 }
      );
    }

    // =====================
    // 4. Store in Redis
    // =====================
    const redisResponse = await fetch(redisUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${redisToken}`,
      },
      body: JSON.stringify({
        command: ["JSON.SET", "coins", "$", redisValue],
      }),
    });

    if (!redisResponse.ok) {
      const errorText = await redisResponse.text();
      return new Response(
        JSON.stringify({
          error: "Redis operation failed",
          details: errorText,
        }),
        { status: redisResponse.status }
      );
    }

    // =====================
    // 5. Return Success Response
    // =====================
    return new Response(
      JSON.stringify({
        success: true,
        count: coins.length,
        redisStatus: (await redisResponse.json()).result,
      }),
      { status: 200 }
    );
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
