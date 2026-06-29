import { useState, useEffect } from 'react';

// ⚠️ 将这里替换为你真实的 S3 对象公网 URL 或 Cloudflare 自定义域名
// 格式如: https://whalewatch-bucket.s3.ap-northeast-1.amazonaws.com/latest_market_prices.json
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    try {
      // 加上时间戳 ?t=... 防止移动端浏览器或 CDN 进行死板缓存
      const response = await fetch(`${S3_JSON_URL}?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error(`网络请求失败: ${response.status}`);
      }
      
      const json: MarketDataResponse = await response.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      console.error("Fetch Market Data Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 组件挂载时立刻请求一次
    fetchMarketData();

    // 根据传入的时间（默认 60 秒）开启定时轮询
    const intervalId = setInterval(fetchMarketData, refreshIntervalMs);
    
    // 组件卸载时清理定时器，防止内存泄漏
    return () => clearInterval(intervalId);
  }, [refreshIntervalMs]);

  return { data, loading, error, refetch: fetchMarketData };
}