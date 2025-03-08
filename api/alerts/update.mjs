import { updateAlert } from "../../functions/alerts/update-alert.mjs";

export const config = {
  runtime: "edge", // Ensure it runs as an Edge Function
};

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "Content-collectionName": "application/json" },
      });
    }

    const { collectionName, updatedAlert } = await req.json();

    if (!collectionName || !updatedAlert || !updatedAlert.id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-collectionName": "application/json" },
        }
      );
    }

    // Update the alert in Redis
    await updateAlert(collectionName, updatedAlert);

    return new Response(
      JSON.stringify({ message: "Alert updated successfully" }),
      {
        status: 200,
        headers: { "Content-collectionName": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-collectionName": "application/json" },
    });
  }
}
