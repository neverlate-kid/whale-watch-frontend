import { useState, useEffect } from 'react';
import { getMarketStatus } from '../utils/market';

const S3_JSON_URL = process.env.EXPO_PUBLIC_S3_DATA_URL;

export function useMarketData(refreshIntervalMs = 60000) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMarketData = async () => {
    if (!S3_JSON_URL) return; // 没有配置则安全跳过，不报错
    setLoading(true);
    try {
      const response = await fetch(`${S3_JSON_URL}?t=${new Date().getTime()}`);
      if (response.ok) setData(await response.json());
    } catch (err) {
      console.warn("S3 Fetch Error, fallback to API data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData(); // 初始化抓取一次最新快照
    const intervalId = setInterval(() => {
      // 只有在开盘时间段，才发起请求拉取S3，保护你的流量
      if (getMarketStatus() === 'open') fetchMarketData();
    }, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [refreshIntervalMs]);

  return { data, loading, refetch: fetchMarketData };
}