import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/context/theme-context';
import { isMatchSearch, NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useTranslation } from 'react-i18next';

export default function SearchScreen() {
  const { q } = useLocalSearchParams(); // 提取搜索词
  const searchQuery = Array.isArray(q) ? q[0] : q || '';
  
  const { colors } = useAppTheme();
  const router = useRouter();
  const { i18n, t } = useTranslation();

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndFilterStocks = async () => {
      setIsLoading(true);
      try {
        // 请求后端的全量轻量级列表
        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/api/v1/stocks`);
        const json = await response.json();

        if (json.success) {
          // 🚀 核心逻辑：利用本地多语言字典进行过滤
          const filtered = json.data.filter((stock: any) => isMatchSearch(stock.ticker, searchQuery));
          setResults(filtered);
        }
      } catch (error) {
        console.error('Search fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (searchQuery) {
      fetchAndFilterStocks();
    } else {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // 根据当前语言获取股票名字
  const getLocalizedName = (ticker: string) => {
    const info = NIKKEI_225_DICT[ticker];
    if (!info) return ticker;
    if (i18n.language === 'zh') return info.zh;
    if (i18n.language === 'ja') return info.ja;
    if (i18n.language === 'ko') return info.ko;
    return info.en;
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => router.push(`/detail/${item.ticker}`)} // 👈 点击跳转到具体详情页
    >
      <View>
        <Text style={[styles.tickerText, { color: colors.textPrimary }]}>{item.ticker}</Text>
        <Text style={[styles.nameText, { color: colors.textSecondary }]}>{getLocalizedName(item.ticker)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.priceText, { color: colors.textPrimary }]}>¥{item.price?.toLocaleString()}</Text>
        <Text style={[styles.changeText, { color: item.isUp ? '#30D158' : '#FF453A' }]}>
          {item.change}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>搜索结果: "{searchQuery}"</Text>
        <Text style={{ color: colors.textSecondary }}>共找到 {results.length} 只股票</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.textPrimary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.ticker}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          ListEmptyComponent={
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 50 }}>
              未找到匹配的股票
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  tickerText: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  nameText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  priceText: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  changeText: { fontSize: 14, fontWeight: '700', marginTop: 4, textAlign: 'right' }
});