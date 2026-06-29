// src/utils/market.ts
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export function getMarketStatus(): 'open' | 'closed' {
  // 获取当前东京时间
  const now = dayjs().tz('Asia/Tokyo');
  const day = now.day();
  const hour = now.hour();
  const minute = now.minute();

  // 周六 (6) 和周日 (0) 绝对休市
  if (day === 0 || day === 6) {
    return 'closed';
  }

  // 转换为易于比较的整数，如 9:30 变成 930，15:30 变成 1530
  const currentTime = hour * 100 + minute;

  // 东京证券交易所交易时间：09:00 - 15:30 (中间 11:30-12:30 午休为了保持盘面活跃度，我们视为 open)
  if (currentTime >= 900 && currentTime < 1530) {
    return 'open';
  }

  return 'closed';
}