import { StockChart } from '@/components/stock-chart';
import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { getMarketStatus } from '@/utils/market'; // 🌟 引入刚刚创建的股市状态函数
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Dimensions, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 确保时区插件注册 (用于解析 YF 时间戳)
dayjs.extend(utc);
dayjs.extend(timezone);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { theme, colors } = useAppTheme();
  const { isPremium, isLoggedIn, favorites, toggleFavorite } = useAppUser();
  const router = useRouter();
  const [timeZoneMode, setTimeZoneMode] = useState<'JST' | 'local'>('JST');
  const [period, setPeriod] = useState<'1Y' | '10Y'>('1Y');

  const [topMovers, setTopMovers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const todayDate = dayjs().format('YYYY-MM-DD');

  // 🌟 新增：由于首页有3个图表，我们需要用 Set 来独立记录哪个股票正在转菊花
  const [refreshingTickers, setRefreshingTickers] = useState<Set<string>>(new Set());

  const hasAccess = isLoggedIn && isPremium;

  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoading(true);
      try {
        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/api/v1/stocks`);
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
          const sorted = [...json.data]
            .sort((a: any, b: any) => b.volatility_score - a.volatility_score)
            .slice(0, 3);

          const detailedMovers = await Promise.all(
            sorted.map(async (stockItem: any) => {
              try {
                const detailResponse = await fetch(`${baseUrl}/api/v1/stocks/${stockItem.ticker}`);
                const detailJson = await detailResponse.json();
                if (detailJson.success) {
                  return { ...stockItem, ...detailJson.data };
                }
                return stockItem;
              } catch (e) {
                return stockItem;
              }
            })
          );
          setTopMovers(detailedMovers);
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStocks();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true })
    ]).start();
  };

  const handleFavoriteClick = (ticker: string) => {
    if (!isLoggedIn) {
      showToast(`🔐 ${t('loginRequired')}`);
      return;
    }
    if (!isPremium) {
      showToast(`🔒 ${t('memberExclusive')}`);
      return;
    }
    const isCurrentlyFav = favorites.includes(ticker);
    toggleFavorite(ticker);
    showToast(isCurrentlyFav ? t('favRemoved', { ticker }) : t('favAdded', { ticker }));
  };

  // 🌟 核心逻辑：在客户端直接请求 Yahoo Finance 抓取实时数据并拼接
  const handleRefreshLivePrice = async (ticker: string) => {
    // 1. 防御：如果已收盘，直接拒绝请求
    if (getMarketStatus() === 'closed') {
      showToast(`🌙 ${t('marketClosed')}`);
      return;
    }

    // 2. 开启菊花 loading
    setRefreshingTickers(prev => new Set(prev).add(ticker));

    try {
      // 雅虎财经的日股代码通常需要加 ".T" (例如丰田是 7203.T)
      const yfTicker = /^\d{4}$/.test(ticker) ? `${ticker}.T` : ticker;

      // 使用客户端 fetch 直接请求 YF 的轻量级 chart 接口
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yfTicker}?interval=1m&range=1d`);
      const json = await response.json();
      const meta = json.chart.result[0].meta;

      const currentPrice = meta.regularMarketPrice;
      const currentVolume = meta.regularMarketVolume;
      const timestamp = meta.regularMarketTime; // Unix 秒数

      // 3. 将 YF 传回的时间戳，强制格式化为纯正的 JST 东京时间字符串 (YYYY-MM-DD HH:mm:ss)
      const jstDateStr = dayjs.unix(timestamp).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');
      const todayOnlyDateStr = jstDateStr.split(' ')[0];

      // 4. 将新数据合并入前端状态，触发图表重绘
      setTopMovers(prev => prev.map(stock => {
        if (stock.ticker === ticker) {
          const updatedStock = { ...stock };
          updatedStock.price = currentPrice; // 更新外层大字体的价格

          if (updatedStock.daily_data_1y) {
            const newDataArray = [...updatedStock.daily_data_1y];
            const lastPoint = newDataArray[newDataArray.length - 1];

            // 判断数组最后一个点是否已经是今天的点了
            const isLastPointToday = lastPoint && lastPoint.date.startsWith(todayOnlyDateStr);
            const newPoint = { date: jstDateStr, close: currentPrice, volume: currentVolume };

            if (isLastPointToday) {
              // 如果最后一个点是今天的（无论是后端给的空日期，还是之前拼过一次的），直接替换
              newDataArray[newDataArray.length - 1] = newPoint;
            } else {
              // 否则把新点 push 到末尾
              newDataArray.push(newPoint);
            }
            updatedStock.daily_data_1y = newDataArray;
          }
          return updatedStock;
        }
        return stock;
      }));
    } catch (error) {
      console.error("YF Refresh Error:", error);
      showToast(`❌ ${t('refreshFailed', '刷新失败')}`);
    } finally {
      // 3. 关闭菊花 loading
      setRefreshingTickers(prev => {
        const next = new Set(prev);
        next.delete(ticker);
        return next;
      });
    }
  };

  const getDiamondConfig = (ticker: string) => {
    const isFav = favorites.includes(ticker);
    if (!hasAccess) return { style: { opacity: 0.25, filter: 'grayscale(100%)' } as any };
    return isFav ? { style: { opacity: 1.0, transform: [{ scale: 1.15 }] } } : { style: { opacity: 0.5, filter: 'grayscale(100%)' } as any };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <View style={[styles.titleBar, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>{t('brand')}</Text>
          <Text style={[styles.dateBadge, { color: colors.textSecondary }]}>📅 {todayDate}</Text>
        </View>
      </View>

      <View style={styles.carouselContainer}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} snapToInterval={SCREEN_WIDTH - 40} decelerationRate="fast" contentContainerStyle={styles.scrollContent}>
          {topMovers.map((stock) => {
            const chartData = period === '1Y' ? stock.daily_data_1y : stock.weekly_data_10y;
            const diamondConfig = getDiamondConfig(stock.ticker);
            return (
              <View key={stock.ticker} style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border, width: SCREEN_WIDTH - 50 }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.tickerRow}>
                    <Text style={[styles.codeText, { color: colors.textPrimary }]}>
                      {(() => {
                        const info = NIKKEI_225_DICT[stock.ticker];
                        if (!info) return stock.ticker;
                        const lang = i18n.language.substring(0, 2) as keyof typeof info;
                        return info[lang] || info.en;
                      })()}
                    </Text>
                    <TouchableOpacity style={styles.favTouchArea} onPress={() => handleFavoriteClick(stock.ticker)}>
                      <Text style={[{ fontSize: 22 }, diamondConfig.style]}>💎</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.chartWrapper}>
                    {chartData ? (
                      <StockChart
                        ticker={stock.ticker}
                        data={chartData}
                        color={stock.isUp ? '#30D158' : '#FF453A'}
                        textColor={colors.textSecondary}
                        borderColor={colors.border}
                        timeZoneMode={timeZoneMode}
                        onTimeZoneChange={(mode) => setTimeZoneMode(mode)}

                        // 🌟 将刚写好的状态和事件绑定给图表
                        marketStatus={getMarketStatus()}
                        isRefreshing={refreshingTickers.has(stock.ticker)}
                        onRefresh={() => handleRefreshLivePrice(stock.ticker)}
                      />
                    ) : (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    )}
                  </View>
                </View>

                <View style={[styles.tabBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TouchableOpacity style={[styles.tabButton, period === '1Y' && { backgroundColor: theme === 'dark' ? colors.textPrimary : '#1C1C1E' }]} onPress={() => setPeriod('1Y')}>
                    <Text style={[styles.tabText, { color: period === '1Y' ? (theme === 'dark' ? '#0A0A0C' : '#FFFFFF') : colors.textSecondary }]}>{t('periodDaily')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.tabButton, period === '10Y' && { backgroundColor: theme === 'dark' ? colors.textPrimary : '#1C1C1E' }]} onPress={() => setPeriod('10Y')}>
                    <Text style={[styles.tabText, { color: period === '10Y' ? (theme === 'dark' ? '#0A0A0C' : '#FFFFFF') : colors.textSecondary }]}>{t('periodWeekly')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.buttonBg, borderColor: colors.buttonBorder }]} activeOpacity={0.8} onPress={() => router.push('/radar')}>
        <Text style={[styles.buttonText, { color: colors.buttonText }]}>{t('radarButton')}</Text>
      </TouchableOpacity>

      <Animated.View pointerEvents="none" style={[styles.floatingToast, { opacity: toastOpacity, backgroundColor: theme === 'dark' ? '#FFFFFF' : '#1C1C1E' }]}>
        <Text style={[styles.toastText, { color: theme === 'dark' ? '#0A0A0C' : '#FFFFFF' }]}>{toastMessage}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 30, justifyContent: 'space-between' },
  titleBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  brandTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  dateBadge: { fontSize: 10, marginTop: 2, fontWeight: '600', fontFamily: 'monospace' },
  carouselContainer: { flex: 1, marginVertical: 12 },
  scrollContent: { paddingHorizontal: 25, gap: 15 },
  mainCard: { borderRadius: 16, padding: 20, borderWidth: 1, justifyContent: 'space-between', height: '100%' },
  tickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeText: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  favTouchArea: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  chartWrapper: { justifyContent: 'center', marginTop: 12 },
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: 10, borderWidth: 1 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: 11, fontWeight: '700' },
  primaryButton: { borderWidth: 2, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginHorizontal: 20 },
  buttonText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  floatingToast: { position: 'absolute', bottom: '15%', left: '15%', right: '15%', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 5 },
  toastText: { fontSize: 12, fontWeight: '700', textAlign: 'center' }
});