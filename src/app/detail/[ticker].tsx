import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/context/theme-context';
import { StockChart } from '@/components/stock-chart';
import { useTranslation } from 'react-i18next';

export default function DetailScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const { colors } = useAppTheme();
  const router = useRouter();

  // 1. 核心状态：初始化为 null，等待 API 数据
  const [stock, setStock] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeZoneMode, setTimeZoneMode] = useState<'JST' | 'local'>('JST');

  // 2. 独立数据获取：不再依赖 mock 数据
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
        console.error("加载股票详情失败:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockDetail();
  }, [ticker]);

  // 3. 加载中状态
  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  // 4. 防御性渲染：确保 stock 存在才渲染组件
  if (!stock) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>无法加载股票数据</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollBody}>
        {/* 顶部返回按钮 */}
        <TouchableOpacity style={styles.header} onPress={() => router.back()}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>← {ticker}</Text>
        </TouchableOpacity>

        {/* 图表卡片：现在 stock.isUp 和 daily_data_1y 是完全可用的 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tickerCode, { color: colors.textPrimary }]}>{ticker}</Text>
          <View style={styles.chartWrapper}>
            <StockChart 
              data={stock.daily_data_1y} 
              color={stock.isUp ? '#30D158' : '#FF453A'} // 这里的 stock.isUp 现在是安全的
              textColor={colors.textSecondary}
              borderColor={colors.border}
              timeZoneMode={timeZoneMode}
              onTimeZoneChange={setTimeZoneMode}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50 },
  header: { paddingHorizontal: 20, marginBottom: 15 },
  title: { fontSize: 20, fontWeight: '800' },
  scrollBody: { paddingBottom: 40 },
  card: { borderRadius: 14, padding: 18, borderWidth: 1, marginHorizontal: 20 },
  tickerCode: { fontSize: 20, fontWeight: '900', fontFamily: 'monospace', marginBottom: 10 },
  chartWrapper: { minHeight: 220, justifyContent: 'center' },
});