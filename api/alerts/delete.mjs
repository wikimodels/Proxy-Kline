import { deleteAlerts } from "../../utils/alerts-storage.mjs";

export const config = {
  runtime: "edge",
  regions: ["lhr1"],
};

export default async function handler(req) {
  if (req.method !== "DELETE") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const url = new URL(req.url);
    const collectionName = url.searchParams.get("collectionName");

    const body = await req.json();
    const { alertIds } = body;

    if (
      !collectionName ||
      !["working", "triggered", "archived"].includes(collectionName)
    ) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing collectionName" }),
        {
          status: 400,
        }
      );
    }

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing alertIds" }),
        {
          status: 400,
        }
      );
    }

    await deleteAlerts(collectionName, alertIds);

    return new Response(
      JSON.stringify({ message: "Alerts deleted successfully" }),
      {
        status: 200,
        headers: { "Content-collectionName": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
      }
    );
  }
}
