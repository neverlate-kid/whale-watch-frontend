import { StockChart } from '@/components/stock-chart';
import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, Dimensions, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { theme, colors } = useAppTheme();
  const { isPremium, isLoggedIn, favorites, toggleFavorite } = useAppUser();
  const router = useRouter();
  const [timeZoneMode, setTimeZoneMode] = useState<'JST' | 'local'>('JST');
  const [period, setPeriod] = useState<'1Y' | '10Y'>('1Y');
  
  // 核心状态
  const [topMovers, setTopMovers] = useState<any[]>([]); // 存放 API 数据
  const [isLoading, setIsLoading] = useState(true); 
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const todayDate = dayjs().format('YYYY-MM-DD');
  
  // 🌟 核心修复：收束真实权限判断逻辑
  const hasAccess = isLoggedIn && isPremium;

  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoading(true);
      try {
        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
        
        // 1. 获取轻量级全量列表 (剔除了庞大K线以确保秒开)
        const response = await fetch(`${baseUrl}/api/v1/stocks`);
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
          // 2. 在前端取异动最大的前3名（此时只有 price/change 等基础信息）
          const sorted = [...json.data]
            .sort((a: any, b: any) => b.volatility_score - a.volatility_score)
            .slice(0, 3);
          
          // 3. 核心修复：针对选出的前3名，并发请求获取详细数据（包含 daily_data_1y 和 weekly_data_10y）
          const detailedMovers = await Promise.all(
            sorted.map(async (stockItem: any) => {
              try {
                const detailResponse = await fetch(`${baseUrl}/api/v1/stocks/${stockItem.ticker}`);
                const detailJson = await detailResponse.json();
                if (detailJson.success) {
                  // 将轻量级接口中的计算字段（如 isUp, change）与详情接口中的全量 K 线数组合并
                  return { ...stockItem, ...detailJson.data };
                }
                return stockItem;
              } catch (e) {
                console.error(`加载 ${stockItem.ticker} 详细数据失败:`, e);
                return stockItem; // 请求失败时退回使用轻量数据
              }
            })
          );
          
          // 4. 将合并后的完整数据写入状态
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
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 180, useNativeDriver: true })
    ]).start();
  };

  const handleFavoriteClick = (ticker: string) => {
    // 🌟 核心修复：优先拦截未登录用户
    if (!isLoggedIn) {
      showToast(`🔐 ${t('loginRequired')}`);
      return;
    }
    // 其次拦截非会员
    if (!isPremium) {
      showToast(`🔒 ${t('memberExclusive')}`);
      return;
    }

    const isCurrentlyFav = favorites.includes(ticker);
    toggleFavorite(ticker);
    showToast(isCurrentlyFav ? t('favRemoved', { ticker }) : t('favAdded', { ticker }));
  };

  const getDiamondConfig = (ticker: string) => {
    const isFav = favorites.includes(ticker);
    // 🌟 核心修复：依据真实的 hasAccess 渲染状态
    if (!hasAccess) return { style: { opacity: 0.25, filter: 'grayscale(100%)' } as any };
    return isFav ? { style: { opacity: 1.0, transform: [{ scale: 1.15 }] } } : { style: { opacity: 0.5, filter: 'grayscale(100%)' } as any };
  };

  // 渲染加载态
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
            // 合并数据后，这里就可以安全地拿到 daily_data_1y 或 weekly_data_10y
            const chartData = period === '1Y' ? stock.daily_data_1y : stock.weekly_data_10y;
            const diamondConfig = getDiamondConfig(stock.ticker);
            return (
              <View key={stock.ticker} style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border, width: SCREEN_WIDTH - 50 }]}>
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
                <View style={styles.priceContainer}>
                  <Text style={[styles.priceValue, { color: colors.textPrimary }]}>¥{stock.price.toLocaleString()}</Text>
                  <Text style={[styles.changeValue, { color: stock.isUp ? '#30D158' : '#FF453A' }]}>{stock.change}</Text>
                </View>
                <View style={styles.chartWrapper}>
                  {/* 给渲染图表增加一层容错，如果详情数据没拉到就显示菊花圈 */}
                  {chartData ? (
                    <StockChart ticker={stock.ticker} data={chartData} color={stock.isUp ? '#30D158' : '#FF453A'} textColor={colors.textSecondary} borderColor={colors.border} timeZoneMode={timeZoneMode} onTimeZoneChange={(mode) => setTimeZoneMode(mode)} />
                  ) : (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  )}
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
  stockName: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  priceValue: { fontSize: 32, fontWeight: '900', fontFamily: 'monospace' },
  changeValue: { fontSize: 16, fontWeight: '700' },
  chartWrapper: { alignItems: 'center', justifyContent: 'center', marginVertical: 5, flex: 1 },
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: 10, borderWidth: 1 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabText: { fontSize: 11, fontWeight: '700' },
  primaryButton: { borderWidth: 2, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginHorizontal: 20 },
  buttonText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  floatingToast: { position: 'absolute', bottom: '15%', left: '15%', right: '15%', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, alignItems: 'center', justifyContent: 'center', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 5 },
  toastText: { fontSize: 12, fontWeight: '700', textAlign: 'center' }
});