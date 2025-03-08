import { redisFetch } from "../utility/redis-fetch.mjs";

export async function updateAlert(collectionName, updatedAlert) {
  const key = `alerts:${collectionName}`;
  const alertKey = `alerts:data:${updatedAlert.id}`;

  // Fetch the existing alert
  const existingAlert = await redisFetch("get", [alertKey]);

  if (!existingAlert) {
    throw new Error(`Alert with ID ${updatedAlert.id} not found.`);
  }

  // Remove the old alert from the collection
  await redisFetch("srem", [key, updatedAlert.id]);

  // Store the updated alert
  await redisFetch("set", [alertKey, JSON.stringify(updatedAlert)]);

  // Add the updated alert ID back to the collection
  await redisFetch("sadd", [key, updatedAlert.id]);
}
