import { useState, useEffect } from 'react';
import { getMarketStatus } from '../utils/market';

const S3_JSON_URL = process.env.EXPO_PUBLIC_S3_DATA_URL;

export function useMarketData(refreshIntervalMs = 60000) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false); // 🌟 新增 error 状态

  const fetchMarketData = async () => {
    if (!S3_JSON_URL) return; 
    setLoading(true);
    try {
      const response = await fetch(`${S3_JSON_URL}?t=${new Date().getTime()}`);
      if (response.ok) {
        setData(await response.json());
        setError(false); // 🌟 请求成功，清除错误状态
      } else {
        setError(true);  // 🌟 接口返回 403/404/500 等非成功状态码时，标记错误
      }
    } catch (err) {
      console.warn("S3 Fetch Error, fallback to API data.", err);
      setError(true);    // 🌟 网络断开或跨域拦截时，进入 catch 并标记错误
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData(); 
    const intervalId = setInterval(() => {
      if (getMarketStatus() === 'open') fetchMarketData();
    }, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [refreshIntervalMs]);

  // 🌟 将 error 暴露给组件
  return { data, loading, error, refetch: fetchMarketData };
}