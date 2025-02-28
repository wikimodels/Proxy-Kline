import { getIntervalDurationMs } from "../get-interval-duration-ms.mjs";
import { getBingXFrInterval } from "./get-bingx-fr-interval.mjs";
import { bingXFrUrl } from "./bingx-fr-url";
import { calculateCloseTime } from "../calculate-close-time.mjs";

export const fetchBingXFr = async (coins, timeframe, limit) => {
  const intervalMs = getIntervalDurationMs(timeframe);
  const bingXInterval = getBingXFrInterval(timeframe);

  const promises = coins.map(async (coin) => {
    try {
      const url = bingXFrUrl(coin.symbol, bingXInterval, limit);
      const response = await fetch(url);
      const data = await response.json();

      if (!data?.data || !Array.isArray(data.data)) {
        console.error(`Invalid response structure for ${coin.symbol}:`, data);
        throw new Error(`Invalid response structure for ${coin.symbol}`);
      }

      // // ✅ Fix: Iterate over data.data directly (not data.data[0])
      const klineData = data.data.map((entry) => ({
        openTime: Number(entry.fundingTime),
        closeTime: calculateCloseTime(Number(entry.fundingTime), intervalMs),
        symbol: coin.symbol,
        category: coin.category || "unknown",
        exchanges: coin.exchanges || [],
        fundingRate: Number(entry.fundingRate),
      }));

      // klineData.reverse();
      // klineData.pop();
      return { symbol: coin.symbol, klineData };
    } catch (error) {
      console.error(`Error processing ${coin.symbol}:`, error);
      return { symbol: coin.symbol, klineData: [] };
    }
  });

  return Promise.all(promises);
};
