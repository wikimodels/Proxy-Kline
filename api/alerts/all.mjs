import { fetchAlerts } from "../../functions/alerts/fetch-alerts.mjs";

export const config = {
  runtime: "edge",
  regions: ["lhr1"],
};

export default async function handler(req) {
  const url = new URL(req.url);
  const collectionName = url.searchParams.get("collectionName");
  console.log(collectionName);

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
      }
    );
  }

  const alerts = await fetchAlerts(collectionName);
  return new Response(JSON.stringify(alerts), {
    status: 200,
    headers: { "Content-collectionName": "application/json" },
  });
}
