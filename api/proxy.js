// api/get-coins.js

export const config = {
  runtime: "edge",
  regions: ["fra1"], // Change to an allowed region if needed.
};

export default async function handler(request) {
  // Retrieve environment variables.
  const redisUrl = process.env.REDIS_REST_URL;
  const redisToken = process.env.REDIS_REST_TOKEN;
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

  // Use Upstash Redis REST API to set a key "foo" to "bar"
  const setUrl = `${redisUrl}/SET/foo/${encodeURIComponent("bar")}`;
  const setResponse = await fetch(setUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${redisToken}`,
    },
  });

  if (!setResponse.ok) {
    const errorText = await setResponse.text();
    return new Response(
      JSON.stringify({
        error: "Error setting value in Redis",
        details: errorText,
      }),
      {
        status: setResponse.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Retrieve the value of key "foo" from Redis
  const getUrl = `${redisUrl}/GET/foo`;
  const getResponse = await fetch(getUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${redisToken}`,
    },
  });

  if (!getResponse.ok) {
    const errorText = await getResponse.text();
    return new Response(
      JSON.stringify({
        error: "Error getting value from Redis",
        details: errorText,
      }),
      {
        status: getResponse.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const redisResult = await getResponse.json();

  // Build the payload for the MongoDB Data API request.
  const payload = {
    dataSource: "Cluster0",
    database: "general",
    collection: "coin-repo",
    filter: {}, // Retrieve all documents (adjust if needed)
  };

  try {
    // Call the MongoDB Atlas Data API.
    const mongoResponse = await fetch(dataApiUrl, {
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

    // Return both the Redis value and the MongoDB data.
    return new Response(JSON.stringify({ redisValue: redisResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching data", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
