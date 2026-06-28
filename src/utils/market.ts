import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 确保时区插件被注册
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 判断当前日本股市（东京证券交易所 TSE）是否处于交易时段
 * 交易日: 周一至周五
 * 早盘: 09:00 - 11:30 (JST)
 * 午休: 11:30 - 12:30 (JST)
 * 午盘: 12:30 - 15:30 (JST)
 * * @returns 'open' | 'closed'
 */
export const getMarketStatus = (): 'open' | 'closed' => {
  // 1. 获取当前纯正的日本东京时间，无视用户手机所在的物理位置
  const nowJst = dayjs().tz('Asia/Tokyo');
  const dayOfWeek = nowJst.day(); // 0 是周日，6 是周六
  
  // 2. 拦截周末：周六和周日全天收盘
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'closed';
  }
  
  // 3. 将当前时间转换为“距离零点过了多少分钟”，方便进行绝对值大小比较
  const hour = nowJst.hour();
  const minute = nowJst.minute();
  const timeInMinutes = hour * 60 + minute;
  
  // 定义关键时间节点的分钟数
  const openTime = 9 * 60;              // 09:00 = 540
  const morningClose = 11 * 60 + 30;    // 11:30 = 690
  const afternoonOpen = 12 * 60 + 30;   // 12:30 = 750
  const closeTime = 15 * 60 + 30;       // 15:30 = 930
  
  // 4. 盘前 (09:00 之前) 或 盘后 (15:30 之后)
  if (timeInMinutes < openTime || timeInMinutes >= closeTime) {
    return 'closed';
  }
  
  // 5. 午休时间 (11:30 算作收盘，直到 12:30 重新开盘)
  if (timeInMinutes >= morningClose && timeInMinutes < afternoonOpen) {
    return 'closed';
  }

  // 6. 排除以上所有情况，剩下的就是交易时间
  return 'open';
};