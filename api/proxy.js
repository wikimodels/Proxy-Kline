// api/get-coins.js

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  // Retrieve environment variables.
  const redisUrl = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  const dataApiUrl = process.env.DATA_API_URL;
  const dataApiKey = process.env.DATA_API_KEY;

  if (!redisUrl || !redisToken) {
    return new Response(
      JSON.stringify({ error: "Missing Upstash Redis configuration." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!dataApiUrl || !dataApiKey) {
    return new Response(
      JSON.stringify({ error: "Missing MongoDB Data API configuration." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build the payload for the MongoDB Data API request.
  const payload = {
    dataSource: "Cluster0",
    database: "general",
    collection: "coin-repo",
    filter: {},
  };

  try {
    // Fetch coin data from MongoDB Data API.
    const mongoResponse = await fetch(dataApiUrl + "/action/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": dataApiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!mongoResponse.ok) {
      const errorText = await mongoResponse.text();
      return new Response(
        JSON.stringify({
          error: "Error fetching MongoDB data",
          details: errorText,
        }),
        {
          status: mongoResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const mongoData = await mongoResponse.json();
    const coins = mongoData.documents || [];
    const coinsCount = coins.length;

    // Use POST to store the coins in Redis to avoid a too-long URL.
    const setResponse = await fetch(`${redisUrl}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${redisToken}`,
      },
      body: JSON.stringify({
        command: ["SET", "coins", JSON.stringify(coins)],
      }),
    });

    if (!setResponse.ok) {
      const errorText = await setResponse.text();
      return new Response(
        JSON.stringify({
          error: "Error storing coins data in Redis",
          details: errorText,
        }),
        {
          status: setResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return JSON with the number of coins stored.
    return new Response(JSON.stringify({ stored: coinsCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error processing request",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
