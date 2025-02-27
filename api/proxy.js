// api/get-coins.js

export const config = {
  runtime: "edge",
  regions: ["fra1"],
};

export default async function handler(request) {
  // Retrieve environment variables.
  const redisUrlRaw = process.env.KV_REST_API_URL;
  const redisToken = process.env.KV_REST_API_TOKEN;
  const dataApiUrl = process.env.DATA_API_URL;
  const dataApiKey = process.env.DATA_API_KEY;

  if (!redisUrlRaw || !redisToken) {
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

  // Remove any trailing slash from the Redis URL.
  const redisUrl = redisUrlRaw.replace(/\/$/, "");

  // Build the payload for the MongoDB Data API request.
  const mongoPayload = {
    dataSource: "Cluster0",
    database: "general",
    collection: "coin-repo",
    filter: {},
  };

  try {
    // Fetch coin data from MongoDB.
    const mongoResponse = await fetch(dataApiUrl + "/action/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": dataApiKey,
      },
      body: JSON.stringify(mongoPayload),
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

    // Build the RedisJSON command payload using the correct root path "$"
    const redisPayload = {
      command: ["JSON.SET", "coins", "$", JSON.stringify(coins)],
    };

    // Log the payload for debugging (remove in production)
    //console.log("Redis Payload:", redisPayload);

    // Use a POST request to store the coins data in Redis.
    const setResponse = await fetch(redisUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${redisToken}`,
      },
      body: JSON.stringify(redisPayload),
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

    // Return a JSON response with the number of coins stored.
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
