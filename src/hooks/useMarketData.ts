// src/hooks/useMarketData.ts
import { useState, useEffect } from 'react';
import { getMarketStatus } from '../utils/market'; // 🌟 引入状态判断

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
    // 无论开盘还是休市，首次进入页面必须拉取一次最新快照（获取昨日收盘最终价格）
    fetchMarketData();

    // 🌟 智能轮询机制
    const intervalId = setInterval(() => {
      // 只有在开盘时间段内，才发起网络请求拉取 S3 数据
      if (getMarketStatus() === 'open') {
        fetchMarketData();
      } else {
        // 如果发现已经收盘，直接跳过不发请求，默默等待明天开盘
        // console.log('市场已休市，暂停自动刷新');
      }
    }, refreshIntervalMs);

    return () => clearInterval(intervalId);
  }, [refreshIntervalMs]);

  return { data, loading, refetch: fetchMarketData };
}