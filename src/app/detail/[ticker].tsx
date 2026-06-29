import { StockChart } from '@/components/stock-chart';
import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { useMarketData } from '@/hooks/useMarketData'; // 🌟 引入刚创建的 S3 Hook
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

  // 本地/后端的历史数据状态
  const [stock, setStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeZoneMode, setTimeZoneMode] = useState<'JST' | 'local'>('JST');

  // 🌟 挂载全局 S3 数据 Hook（统一从云端获取 225 只股票的最新状态）
  const { data: realTimeData, loading: isRefreshingLive, refetch: refetchLive } = useMarketData(60000);

  // 1. 获取后端 FastAPI 的历史数据 (只在首次加载执行)
  useEffect(() => {
    const fetchStockDetail = async () => {
      if (!ticker) return;
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

        if (json.success) {
          setStock(json.data);
        }
      } catch (e) {
        console.error("Failed loading stock information:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockDetail();
  }, [ticker]);

  // 2. 🌟 核心逻辑：监听 S3 实时数据变化，自动将最新价格拼接到历史图表数组中
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

          // 解析 S3 传来的 timestamp，转换为 JST 格式，供图表组件消费
          const jstDateStr = dayjs(liveInfo.timestamp).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');
          const todayOnlyDateStr = jstDateStr.split(' ')[0];

          const isLastPointToday = lastPoint && lastPoint.date.startsWith(todayOnlyDateStr);
          const newPoint = { date: jstDateStr, close: liveInfo.price, volume: liveInfo.volume };

          // 如果数组最后一个点是今天，就覆盖它；如果是昨天，就 push 新的一天
          if (isLastPointToday) {
            newDataArray[newDataArray.length - 1] = newPoint;
          } else {
            newDataArray.push(newPoint);
          }
          updatedStock.daily_data_1y = newDataArray;
        }
        return updatedStock;
      });
    }
  }, [realTimeData, ticker]);

  // 🌟 覆盖原有的刷新方法，现在的刷新直接去拉 CDN 上的文件，再也不用担心被封禁
  const handleRefreshLivePrice = async () => {
    if (getMarketStatus() === 'closed') return;
    refetchLive(); // 触发 Hook 重新拉取
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  if (!stock) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>{t('stockLoadError', '股票加载失败')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
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
        </View>

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
              color={stock.isUp ? '#30D158' : '#FF453A'}
              textColor={colors.textSecondary}
              borderColor={colors.border}
              timeZoneMode={timeZoneMode}
              onTimeZoneChange={setTimeZoneMode}

              // 直接传入 hook 里的状态，图表内部的刷新动画会自动触发
              marketStatus={getMarketStatus()}
              isRefreshing={isRefreshingLive}
              onRefresh={handleRefreshLivePrice}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 8, gap: 15 },
  backCapsule: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 1, elevation: 1 },
  scrollBody: { paddingBottom: 40 },
  card: { borderRadius: 14, padding: 18, borderWidth: 1, marginHorizontal: 20 },
  tickerCode: { fontSize: 20, fontWeight: '900', fontFamily: 'monospace', marginBottom: 10 },
  chartWrapper: { minHeight: 220, justifyContent: 'center' },
});