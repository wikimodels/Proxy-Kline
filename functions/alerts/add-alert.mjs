import { redisFetch } from "../utility/redis-fetch.mjs";

export async function addAlert(alert, collectionName) {
  const alertKey = `alert:${collectionName}:${alert.id}`;
  await redisFetch("set", [alertKey, JSON.stringify(alert)]);
  await redisFetch("sadd", [`alerts:${collectionName}`, alert.id]); // Store ID in a set
}
