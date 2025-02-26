// api/get-coins.js

export const config = {
  runtime: "edge",
  regions: ["fra1"], // Change to an allowed region if needed.
};

export default async function handler(request) {
  // Retrieve the API URL and API key from environment variables.
  const apiUrl = process.env.MONGO_DATA_API_URL;
  const apiKey = process.env.MONGO_DATA_API_KEY;

  if (!apiUrl || !apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing MongoDB Data API configuration." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build the payload for the Data API request.
  const payload = {
    dataSource: "Cluster0", // Your cluster name
    database: "general", // Your database name
    collection: "coin-repo", // Your collection name
    filter: {}, // Retrieve all documents (adjust if needed)
  };

  try {
    // Call the MongoDB Atlas Data API.
    const response = await fetch(apiUrl, {
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

    const data = await response.json();
    return new Response(JSON.stringify(data), {
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
