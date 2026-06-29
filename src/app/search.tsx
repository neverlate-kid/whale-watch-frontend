import { isMatchSearch, NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useMarketData } from '@/hooks/useMarketData';

export default function SearchScreen() {
  const { t } = useTranslation();
  const { q } = useLocalSearchParams();
  const searchQuery = Array.isArray(q) ? q[0] : q || '';

  const { colors } = useAppTheme();
  const router = useRouter();
  const { i18n } = useTranslation();

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 挂载 S3 全局数据钩子
  const { data: realTimeData } = useMarketData(60000);

  useEffect(() => {
    const fetchAndFilterStocks = async () => {
      setIsLoading(true);
      try {
        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/api/v1/stocks`);
        const json = await response.json();
        if (json.success) {
          const filtered = json.data.filter((stock: any) => isMatchSearch(stock.ticker, searchQuery));
          setResults(filtered);
        }
      } catch (error) {
        console.error('Search fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (searchQuery) fetchAndFilterStocks();
    else setIsLoading(false);
  }, [searchQuery]);

  // 🌟 将后端数据库的基础数据，与 S3 的最新价格进行合并
  const displayResults = useMemo(() => {
    return results.map(item => {
      const s3Info = realTimeData?.stocks?.[item.ticker];
      // 如果没有配置 S3，就回退展示原先从 FastAPI 查到的收盘数据
      if (!s3Info) return { ...item, livePrice: item.price, liveChange: item.change, isUp: item.change >= 0 };
      
      const livePrice = s3Info.price;
      const diff = livePrice - item.price;
      const liveChangePercent = ((diff / item.price) * 100).toFixed(2) + '%';
      
      return { 
        ...item, 
        livePrice, 
        liveChange: diff >= 0 ? '+' + liveChangePercent : liveChangePercent, 
        isUp: diff >= 0 
      };
    });
  }, [results, realTimeData]);

  const getLocalizedName = (ticker: string) => {
    const info = NIKKEI_225_DICT[ticker];
    if (!info) return ticker;
    if (i18n.language === 'zh') return info.zh;
    if (i18n.language === 'ja') return info.ja;
    if (i18n.language === 'ko') return info.ko;
    return info.en;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('searchPrefix')} <Text style={{ fontWeight: '900' }}>{searchQuery}</Text>
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.textPrimary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={displayResults}
          keyExtractor={(item) => item.ticker}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/detail/${item.ticker}`)}
            >
              <View>
                <Text style={[styles.tickerText, { color: colors.textPrimary }]}>{item.ticker}</Text>
                <Text style={[styles.nameText, { color: colors.textSecondary }]}>{getLocalizedName(item.ticker)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.priceText, { color: colors.textPrimary }]}>¥{item.livePrice?.toLocaleString()}</Text>
                <Text style={[styles.changeText, { color: item.isUp ? '#30D158' : '#FF453A' }]}>
                  {item.liveChange}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 12, gap: 15 },
  backCapsule: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1, elevation: 2 },
  title: { fontSize: 18, fontWeight: '800' },
  resultCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1, borderRadius: 12 },
  tickerText: { fontSize: 16, fontWeight: '800' },
  nameText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  priceText: { fontSize: 16, fontWeight: '800' },
  changeText: { fontSize: 14, fontWeight: '700', marginTop: 4, textAlign: 'right' }
});