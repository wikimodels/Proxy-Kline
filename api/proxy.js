// api/get-coins.js

export const config = {
  runtime: "edge",
  regions: ["fra1"], // Use an allowed region if needed.
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
    filter: {}, // Retrieve all documents (adjust filter if needed)
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

    // Store coins data in Redis under the key "coins".
    const setUrl = `${redisUrl}/SET/coins/${encodeURIComponent(
      JSON.stringify(coins)
    )}`;
    const setResponse = await fetch(setUrl, {
      method: "GET", // Upstash REST API uses GET for commands like SET.
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
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
