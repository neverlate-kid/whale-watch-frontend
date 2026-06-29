import { StockChart } from '@/components/stock-chart';
import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useMarketData } from '@/hooks/useMarketData'; // 🌟 引入 S3 Hook
import { getMarketStatus } from '@/utils/market';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  const [baseTopMovers, setBaseTopMovers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const todayDate = dayjs().format('YYYY-MM-DD');

  const hasAccess = isLoggedIn && isPremium;
  const marketStatus = getMarketStatus();

  // 🌟 挂载全局 S3 数据
  const { data: realTimeData, loading: marketLoading, refetch: refetchLive } = useMarketData(60000);

  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!baseUrl) {
          console.warn("⚠️ 未配置后端 API 环境变量 (EXPO_PUBLIC_API_URL)");
          setIsLoading(false);
          return;
        }
        const response = await fetch(`${baseUrl}/api/v1/stocks`);
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
          // 在轻量级列表里排序出前三名
          const sorted = [...json.data]
            .sort((a: any, b: any) => b.volatility_score - a.volatility_score)
            .slice(0, 3);

          // 去取这前三名的详情(历史走势)并合并
          const detailedMovers = await Promise.all(
            sorted.map(async (stockItem: any) => {
              try {
                const detailResponse = await fetch(`${baseUrl}/api/v1/stocks/${stockItem.ticker}`);
                const detailJson = await detailResponse.json();
                return detailJson.success ? { ...stockItem, ...detailJson.data } : stockItem;
              } catch (e) {
                return stockItem;
              }
            })
          );
          setBaseTopMovers(detailedMovers);
        }
      } catch (error) {
        console.error("加载首页底座数据失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStocks();
  }, []);

  // 🌟 核心引擎：在图表数组里伪装塞入最新的 S3 节点
  const displayMovers = useMemo(() => {
    return baseTopMovers.map(stock => {
      const s3Info = realTimeData?.stocks?.[stock.ticker];

      if (!s3Info) {
        return { ...stock, livePrice: stock.price, isUp: stock.isUp };
      }

      const livePrice = s3Info.price;
      const prevPrice = stock.prev_price || stock.price; // 用后端的昨收价计算基准
      const diff = livePrice - prevPrice;
      const isUp = diff >= 0;

      let newDailyData = stock.daily_data_1y;
      if (newDailyData && newDailyData.length > 0) {
        newDailyData = [...newDailyData];
        const jstDateStr = dayjs(s3Info.timestamp).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');
        const todayOnlyDateStr = jstDateStr.split(' ')[0];
        const lastPoint = newDailyData[newDailyData.length - 1];

        // 组装实时的图表端点
        const newPoint = { date: jstDateStr, close: livePrice, volume: s3Info.volume };

        // 今天的数据则覆盖，昨天的数据则新增
        if (lastPoint && lastPoint.date.startsWith(todayOnlyDateStr)) {
          newDailyData[newDailyData.length - 1] = newPoint;
        } else {
          newDailyData.push(newPoint);
        }
      }

      return { ...stock, livePrice, isUp, daily_data_1y: newDailyData };
    });
  }, [baseTopMovers, realTimeData]);

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
    if (!isLoggedIn) return showToast(`🔐 ${t('loginRequired')}`);
    if (!isPremium) return showToast(`🔒 ${t('memberExclusive')}`);
    toggleFavorite(ticker);
    showToast(favorites.includes(ticker) ? t('favRemoved', { ticker }) : t('favAdded', { ticker }));
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
          {displayMovers.map((stock) => {
            const chartData = period === '1Y' ? stock.daily_data_1y : stock.weekly_data_10y;

            return (
              <View key={stock.ticker} style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border, width: SCREEN_WIDTH - 50 }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.tickerRow}>
                    <View>
                      <Text style={[styles.codeText, { color: colors.textPrimary }]}>
                        {(() => {
                          const info = NIKKEI_225_DICT[stock.ticker];
                          if (!info) return stock.ticker;
                          const lang = i18n.language.substring(0, 2) as keyof typeof info;
                          return info[lang] || info.en;
                        })()}
                      </Text>
                      {/* 🌟 大字实时报价区 */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={[styles.livePriceText, { color: stock.isUp ? '#30D158' : '#FF453A' }]}>
                          ¥{stock.livePrice?.toLocaleString()}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: marketStatus === 'open' ? '#30D15820' : colors.border }]}>
                          <View style={[styles.statusDot, { backgroundColor: marketStatus === 'open' ? '#30D158' : colors.textSecondary }]} />
                          <Text style={[styles.statusText, { color: marketStatus === 'open' ? '#30D158' : colors.textSecondary }]}>
                            {marketStatus === 'open' ? t('statusLive') : t('statusClosed')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.favTouchArea} onPress={() => handleFavoriteClick(stock.ticker)}>
                      <Text style={[{ fontSize: 22 }, getDiamondConfig(stock.ticker).style]}>💎</Text>
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
                        onTimeZoneChange={setTimeZoneMode}
                        marketStatus={marketStatus}
                        isRefreshing={marketLoading}
                        onRefresh={refetchLive} // 点击刷新直接触发 S3 数据获取
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
  tickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  codeText: { fontSize: 16, fontWeight: '800' },
  livePriceText: { fontSize: 24, fontWeight: '900', fontFamily: 'monospace', marginRight: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  statusText: { fontSize: 9, fontWeight: '800' },
  favTouchArea: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  chartWrapper: { justifyContent: 'center', marginTop: 12 },
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: 10, borderWidth: 1, marginTop: 10 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: 11, fontWeight: '700' },
  primaryButton: { borderWidth: 2, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginHorizontal: 20 },
  buttonText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  floatingToast: { position: 'absolute', bottom: '15%', left: '15%', right: '15%', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 5 },
  toastText: { fontSize: 12, fontWeight: '700', textAlign: 'center' }
});