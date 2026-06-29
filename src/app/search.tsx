import { isMatchSearch, NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { getMarketStatus } from '@/utils/market';
import { useMarketData } from '@/hooks/useMarketData'; // 🌟 引入 S3
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const { q } = useLocalSearchParams();
  const searchQuery = Array.isArray(q) ? q[0] : q || '';
  const { colors } = useAppTheme();
  const router = useRouter();

  const [baseResults, setBaseResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const marketStatus = getMarketStatus();

  // 🌟 S3 数据钩子，自动后台加载
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
          setBaseResults(filtered);
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

  // 🌟 核心融合：将后台数据和 S3 数据合并显示
  const displayResults = useMemo(() => {
    return baseResults.map(item => {
      const s3Info = realTimeData?.stocks?.[item.ticker];
      if (!s3Info) {
         return { ...item, livePrice: item.price, liveChangePercent: 0, isUp: item.change >= 0 };
      }
      
      const livePrice = s3Info.price;
      const liveChange = livePrice - item.price; // 当前价 - 昨收价
      const liveChangePercent = (liveChange / item.price) * 100;
      
      return {
        ...item,
        livePrice,
        liveChangePercent,
        isUp: liveChange >= 0
      };
    });
  }, [baseResults, realTimeData]);

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
        <View style={{ marginTop: 100, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '700' }}>
            {t('statusFetching')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayResults}
          keyExtractor={(item) => item.ticker}
          renderItem={({ item }) => {
            const priceColor = item.isUp ? '#30D158' : '#FF453A';
            return (
              <TouchableOpacity
                style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/detail/${item.ticker}`)}
              >
                <View>
                  <Text style={[styles.tickerText, { color: colors.textPrimary }]}>{item.ticker}</Text>
                  <Text style={[styles.nameText, { color: colors.textSecondary }]}>{getLocalizedName(item.ticker)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                    ¥{item.livePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: marketStatus === 'open' ? '#30D158' : colors.textSecondary }]} />
                    <Text style={[styles.changeText, { color: priceColor }]}>
                      {item.isUp ? '+' : ''}{item.liveChangePercent?.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 12, gap: 15 },
  backCapsule: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  resultCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1, borderRadius: 12 },
  tickerText: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  nameText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  priceText: { fontSize: 16, fontWeight: '900', fontFamily: 'monospace' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  changeText: { fontSize: 13, fontWeight: '800', fontFamily: 'monospace' }
});