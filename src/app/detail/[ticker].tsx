import { NewsItem, RecentNews } from '@/components/recent-news'; // 🌟 引入独立的新闻组件
import { StockChart } from '@/components/stock-chart';
import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { useMarketData } from '@/hooks/useMarketData';
import { getMarketStatus } from '@/utils/market';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function DetailScreen() {
  const { t, i18n } = useTranslation();
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const { colors } = useAppTheme();
  const router = useRouter();

  // 状态管理
  const [stock, setStock] = useState<any>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeZoneMode, setTimeZoneMode] = useState<'JST' | 'local'>('JST');

  // S3 实时数据 Hook
  const { data: realTimeData, loading: isRefreshingLive, error: marketError, refetch: refetchLive } = useMarketData(60000);

  // 1. 获取图表历史数据 + 新闻资讯
  useEffect(() => {
    const fetchDetailAndNews = async () => {
      const tickerStr = typeof ticker === 'string' ? ticker : ticker?.[0];
      if (!tickerStr) return;

      setIsLoading(true);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!baseUrl) {
          console.warn("⚠️ 未配置后端 API 环境变量");
          setIsLoading(false);
          return;
        }

        // 获取当前 App 的语言前缀 (zh, en, ja, ko)
        const currentLang = i18n.language.substring(0, 2);

        const [detailRes, newsRes] = await Promise.all([
          fetch(`${baseUrl}/api/v1/stocks/${tickerStr}`),
          fetch(`${baseUrl}/api/v1/stocks/${tickerStr}/news?lang=${currentLang}`)
        ]);

        const detailJson = await detailRes.json();
        const newsJson = await newsRes.json();

        if (detailJson.success) setStock(detailJson.data);
        if (newsJson.success) setNews(newsJson.data);

      } catch (e) {
        console.error("Failed loading stock detail:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetailAndNews();
  }, [ticker, i18n.language]);

  // 2. 监听 S3 实时数据变化拼接最新价格
  useEffect(() => {
    if (!stock || !realTimeData || !realTimeData.stocks) return;

    const tickerStr = typeof ticker === 'string' ? ticker : ticker?.[0];
    const liveInfo = realTimeData.stocks[tickerStr as string];

    if (liveInfo) {
      setStock((prev: any) => {
        if (!prev) return prev;
        const updatedStock = { ...prev };
        updatedStock.price = liveInfo.price;

        if (updatedStock.daily_data_1y) {
          const newDataArray = [...updatedStock.daily_data_1y];
          const lastPoint = newDataArray[newDataArray.length - 1];

          const jstDateStr = dayjs(liveInfo.timestamp).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');
          const todayOnlyDateStr = jstDateStr.split(' ')[0];

          const isLastPointToday = lastPoint && lastPoint.date.startsWith(todayOnlyDateStr);
          const newPoint = { date: jstDateStr, close: liveInfo.price, volume: liveInfo.volume };

          if (isLastPointToday) newDataArray[newDataArray.length - 1] = newPoint;
          else newDataArray.push(newPoint);

          updatedStock.daily_data_1y = newDataArray;
        }
        return updatedStock;
      });
    }
  }, [realTimeData, ticker]);

  const handleRefreshLivePrice = async () => {
    if (getMarketStatus() === 'closed') return;
    refetchLive();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  if (!stock) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>{t('stockLoadError', '股票加载失败')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle={colors.statusBarStyle} />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={[styles.backCapsule, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <Path d="M15 19L8 12L15 5" stroke={colors.textPrimary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          {/* 🌟 新增断线提示 */}
          {marketError && getMarketStatus() === 'open' && (
            <View style={{ backgroundColor: '#FF453A15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FF453A30', marginLeft: 'auto' }}>
              <Text style={{ color: '#FF453A', fontSize: 10, fontWeight: '800' }}>⚠️ {t('liveDataError')}</Text>
            </View>
          )}
        </View>

        {/* 乐高模块 1：图表组件 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tickerCode, { color: colors.textPrimary }]}>
            {(() => {
              const info = NIKKEI_225_DICT[ticker as string];
              if (!info) return ticker;
              const lang = i18n.language.substring(0, 2) as keyof typeof info;
              return (info as any)[lang] || info.en;
            })()}
          </Text>
          <View style={styles.chartWrapper}>
            <StockChart
              ticker={ticker as string}
              data={stock.daily_data_1y}
              color={stock.isUp !== undefined ? (stock.isUp ? '#30D158' : '#FF453A') : '#30D158'}
              textColor={colors.textSecondary}
              borderColor={colors.border}
              timeZoneMode={timeZoneMode}
              onTimeZoneChange={setTimeZoneMode}
              marketStatus={getMarketStatus()}
              isRefreshing={isRefreshingLive}
              onRefresh={handleRefreshLivePrice}
            />
          </View>
        </View>

        {/* 乐高模块 2：近期新闻流组件 */}
        <RecentNews news={news} />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 8, gap: 15 },
  backCapsule: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 1, elevation: 1 },
  scrollBody: { paddingBottom: 40 },

  // 图表区域样式
  card: { borderRadius: 14, padding: 18, borderWidth: 1, marginHorizontal: 20 },
  tickerCode: { fontSize: 20, fontWeight: '900', fontFamily: 'monospace', marginBottom: 10 },
  chartWrapper: { minHeight: 220, justifyContent: 'center' },
});