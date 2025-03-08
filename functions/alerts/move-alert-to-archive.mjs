import { redisFetch } from "../utility/redis-fetch.mjs";
export async function moveAlertToArchive(alertId) {
  const alertResponse = await redisFetch("get", [`alert:working:${alertId}`]);
  if (!alertResponse.result) return;

  const alert = JSON.parse(alertResponse.result);
  await saveAlert(alert, "archived");
  await removeAlert(alertId, "working");
}
