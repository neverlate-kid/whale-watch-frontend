export interface StockDetail {
  ticker: string;
  nameKey: string; // 用于 i18n 动态匹配
  price: number;
  change: string;
  isUp: boolean;
  daily_data_1y: { date: string; close: number; volume: number }[];
  weekly_data_10y: { date: string; close: number; volume: number }[];
}

export const mockStockData: Record<string, StockDetail> = {
  '9983.T': {
    ticker: '9983.T',
    nameKey: 'stock_9983',
    price: 43250,
    change: '+2.45%',
    isUp: true,
    daily_data_1y: [
      { date: '2026-06-24', close: 41000, volume: 120000 },
      { date: '2026-06-25', close: 42100, volume: 180000 },
      { date: '2026-06-26 15:30:00', close: 43250, volume: 250000 },
    ],
    weekly_data_10y: [
      { date: '2026-05-15', close: 38000, volume: 800000 },
      { date: '2026-06-26', close: 43250, volume: 950000 },
    ]
  },
  '9984.T': {
    ticker: '9984.T',
    nameKey: 'stock_9984',
    price: 8920,
    change: '+5.12%',
    isUp: true,
    daily_data_1y: [
      { date: '2026-06-24', close: 8200, volume: 540000 },
      { date: '2026-06-25', close: 8450, volume: 620000 },
      { date: '2026-06-26 15:30:00', close: 8920, volume: 1100000 }, // 巨量异动
    ],
    weekly_data_10y: [
      { date: '2026-05-15', close: 7900, volume: 3200000 },
      { date: '2026-06-26', close: 8920, volume: 4500000 },
    ]
  },
  '6758.T': {
    ticker: '6758.T',
    nameKey: 'stock_6758',
    price: 13150,
    change: '-1.85%',
    isUp: false,
    daily_data_1y: [
      { date: '2026-06-24', close: 13500, volume: 310000 },
      { date: '2026-06-25', close: 13400, volume: 280000 },
      { date: '2026-06-26 15:30:00', close: 13150, volume: 490000 },
    ],
    weekly_data_10y: [
      { date: '2026-05-15', close: 14000, volume: 1500000 },
      { date: '2026-06-26', close: 13150, volume: 1900000 },
    ]
  }
};

// 模拟全量日经 225 的异动流简要数据
export const mockRadarList = [
  { ticker: '9984.T', nameKey: 'stock_9984', price: '¥8,920', change: '+5.12%', isUp: true, score: 98, reasonKey: 'reason_whale' },
  { ticker: '9983.T', nameKey: 'stock_9983', price: '¥43,250', change: '+2.45%', isUp: true, score: 85, reasonKey: 'reason_ma' },
  { ticker: '6758.T', nameKey: 'stock_6758', price: '¥13,150', change: '-1.85%', isUp: false, score: 79, reasonKey: 'reason_dump' },
  { ticker: '7203.T', nameKey: 'stock_7203', price: '¥3,420', change: '+0.15%', isUp: true, score: 45, reasonKey: 'reason_normal' },
];