import { useState, useEffect } from 'react';

// ⚠️ 这里替换为你接下来在 AWS S3 或 Cloudflare 创建的 JSON 文件地址
const S3_JSON_URL = 'https://[你的S3桶名].s3.[你的可用区].amazonaws.com/latest_market_prices.json';

export interface StockRealTimeData {
  price: number;
  volume: number;
  timestamp: string;
}

export interface MarketDataResponse {
  last_updated: string;
  stocks: Record<string, StockRealTimeData>;
}

export function useMarketData(refreshIntervalMs = 60000) {
  const [data, setData] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMarketData = async () => {
    setLoading(true);
    try {
      // 加上时间戳防止 CDN 缓存
      const response = await fetch(`${S3_JSON_URL}?t=${new Date().getTime()}`);
      if (response.ok) {
        const json: MarketDataResponse = await response.json();
        setData(json);
      }
    } catch (err) {
      console.error("Fetch S3 Market Data Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const intervalId = setInterval(fetchMarketData, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [refreshIntervalMs]);

  return { data, loading, refetch: fetchMarketData };
}