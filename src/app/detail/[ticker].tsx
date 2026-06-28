import { StockChart } from '@/components/stock-chart';
import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { getMarketStatus } from '@/utils/market'; // 🌟 引入状态函数
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function DetailScreen() {
  const { t, i18n } = useTranslation();
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const { colors } = useAppTheme();
  const router = useRouter();

  const [stock, setStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeZoneMode, setTimeZoneMode] = useState<'JST' | 'local'>('JST');
  
  // 🌟 单页面专属的刷新状态
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);

  useEffect(() => {
    const fetchStockDetail = async () => {
      if (!ticker) return;
      setIsLoading(true);
      try {
        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/api/v1/stocks/${ticker}`);
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

  // 🌟 单只股票请求逻辑
  const handleRefreshLivePrice = async () => {
    if (getMarketStatus() === 'closed') return;

    setIsRefreshingLive(true);
    try {
      const yfTicker = /^\d{4}$/.test(ticker as string) ? `${ticker}.T` : ticker;
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yfTicker}?interval=1m&range=1d`);
      const json = await response.json();
      const meta = json.chart.result[0].meta;
      
      const currentPrice = meta.regularMarketPrice;
      const currentVolume = meta.regularMarketVolume;
      const timestamp = meta.regularMarketTime;

      const jstDateStr = dayjs.unix(timestamp).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss');
      const todayOnlyDateStr = jstDateStr.split(' ')[0];

      setStock((prev: any) => {
        const updatedStock = { ...prev };
        updatedStock.price = currentPrice;
        
        if (updatedStock.daily_data_1y) {
          const newDataArray = [...updatedStock.daily_data_1y];
          const lastPoint = newDataArray[newDataArray.length - 1];
          const isLastPointToday = lastPoint && lastPoint.date.startsWith(todayOnlyDateStr);
          const newPoint = { date: jstDateStr, close: currentPrice, volume: currentVolume };
          
          if (isLastPointToday) {
            newDataArray[newDataArray.length - 1] = newPoint;
          } else {
            newDataArray.push(newPoint);
          }
          updatedStock.daily_data_1y = newDataArray;
        }
        return updatedStock;
      });
    } catch (error) {
      console.error("YF Refresh Error in Detail:", error);
    } finally {
      setIsRefreshingLive(false);
    }
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
              
              // 🌟 绑定给图表
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