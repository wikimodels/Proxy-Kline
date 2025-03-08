import { redisFetch } from "../utility/redis-fetch.mjs";

export async function deleteAlerts(collectionName, alertIds) {
  const key = `alerts:${collectionName}`;

  // Remove alerts from the Redis set
  await redisFetch("srem", [key, ...alertIds]);

  // Delete each alert's detailed data
  const pipeline = alertIds.map((alertId) => ["del", `alerts:data:${alertId}`]);

  if (pipeline.length > 0) {
    await redisFetch("pipeline", pipeline);
  }
}
