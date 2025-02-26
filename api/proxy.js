// api/get-coins.js

import { Redis } from "@upstash/redis";

export const config = {
  runtime: "edge",
  regions: ["fra1"], // Use an allowed region if needed.
};

export default async function handler(request) {
  // Retrieve MongoDB API configuration from environment variables.
  const apiUrl = process.env.DATA_API_URL;
  const apiKey = process.env.DATA_API_KEY;

  // Validate that required configurations are present.
  if (!apiUrl || !apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing MongoDB Data API configuration" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Initialize the Upstash Redis client.
  const redis = new Redis({
    url: process.env.REDIS_URL || "your-redis-url", // Preferably use env var
    token: process.env.REDIS_TOKEN || "your-redis-token",
  });

  // Test setting and getting a value from Redis.
  await redis.set("foo", "bar");
  const redisValue = await redis.get("foo");

  // Build the payload for the MongoDB Data API request.
  const payload = {
    dataSource: "Cluster0", // Your cluster name
    database: "general", // Your database name
    collection: "coin-repo", // Your collection name
    filter: {}, // Retrieve all documents (adjust if needed)
  };

  try {
    // Call the MongoDB Atlas Data API.
    const response = await fetch(apiUrl + "/action/find", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: "Error fetching data", details: errorText }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const mongoData = await response.json();

    // Return a single response with both Redis and MongoDB data.
    // return new Response(
    //   JSON.stringify({
    //     redisValue,
    //     mongoData,
    //   }),
    //   {
    //     status: 200,
    //     headers: { "Content-Type": "application/json" },
    //   }
    // );
    return new Response(
      JSON.stringify({
        redisValue,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching data", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
