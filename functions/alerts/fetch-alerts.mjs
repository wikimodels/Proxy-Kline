import { redisFetch } from "../utility/redis-fetch.mjs";
export async function fetchAlerts(collectionName) {
  const idsResponse = await redisFetch("smembers", [
    `alerts:${collectionName}`,
  ]);
  const ids = idsResponse.result || [];

  const alerts = await Promise.all(
    ids.map(async (id) => {
      const alertResponse = await redisFetch("get", [
        `alert:${collectionName}:${id}`,
      ]);
      return alertResponse.result ? JSON.parse(alertResponse.result) : null;
    })
  );

  return alerts.filter((alert) => alert !== null);
}
