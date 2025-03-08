import { addAlert } from "../../functions/alerts/add-alert.mjs";

export const config = {
  runtime: "edge",
  regions: ["lhr1"],
};

export default async function handler(req) {
  // Set CORS headers
  const origin = req.headers.get("Origin") || "*"; // Allow dynamic origin
  const allowedMethods = "POST, GET, OPTIONS";
  const allowedHeaders = "Content-Type, Authorization";

  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin); // Allow specific origin (or '*')
  headers.set("Access-Control-Allow-Methods", allowedMethods); // Allow specific methods
  headers.set("Access-Control-Allow-Headers", allowedHeaders); // Allow necessary headers

  // Handle preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: headers,
      status: 200,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    // Get the URL from the request and extract query parameters
    const url = new URL(req.url);
    const collectionName = url.searchParams.get("collectionName");
    const body = await req.json();
    const { alert } = body;

    // Validate collectionName
    if (
      !collectionName ||
      !["working-alerts", "triggered-alerts", "archived-alerts"].includes(
        collectionName
      )
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing collectionName" }),
        {
          status: 400,
          headers: headers,
        }
      );
    }

    // Validate alert data
    if (!alert || !alert.id) {
      return new Response(JSON.stringify({ error: "Invalid alert data" }), {
        status: 400,
        headers: headers,
      });
    }

    console.log("Collection Name:", collectionName);
    console.log("Alert Data:", alert);

    // Add alert to the appropriate collection
    await addAlert(collectionName, alert);

    // Respond with success
    return new Response(
      JSON.stringify({ message: "Alert added successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...headers }, // Correct header
      }
    );
  } catch (error) {
    console.error("Error in adding alert:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: headers,
      }
    );
  }
}
