import { Redis } from "@upstash/redis";

export async function fetchCoinsFromRedis() {
  // 1. Get coins from Redis
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });

  const rawCoins = await redis.get("coins");
  const coins = Array.isArray(rawCoins) ? rawCoins : [];

  const bybitCoins = coins.filter((c) => c?.exchanges?.includes?.("Bybit"));

  const binanceCoins = coins.filter(
    (c) =>
      c?.exchanges?.includes?.("Binance") && !c?.exchanges?.includes?.("Bybit")
  );

  const bingXCoins = coins.filter(
    (c) =>
      c?.exchanges?.includes?.("BingX PF") &&
      !c?.exchanges?.includes?.("Binance") &&
      !c?.exchanges?.includes?.("Bybit")
  );

  return {
    bybitCoins,
    binanceCoins,
    bingXCoins,
  };
}
