import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/context/theme-context';
import { mockStockData, mockRadarList } from '@/constants/mock-stock';
import { StockChart } from '@/components/stock-chart';
import { useTranslation } from 'react-i18next';

export default function DetailScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const { t } = useTranslation();
  const { colors, theme } = useAppTheme();
  const router = useRouter();

  const [timeZoneMode, setTimeZoneMode] = useState<'JST' | 'local'>('JST');
  
  const stock = mockStockData[ticker || '9983.T'] || mockStockData['9983.T'];
  const radarMeta = mockRadarList.find(r => r.ticker === ticker);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />
      
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>◀ {t('connected')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{ticker} {t('aiAnalysis')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* 1. 图表看板区 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stockName, { color: colors.textPrimary }]}>{t(stock.nameKey)}</Text>
          <View style={styles.chartWrapper}>
            <StockChart 
              data={stock.daily_data_1y} 
              color={stock.isUp ? '#30D158' : '#FF453A'} 
              textColor={colors.textSecondary}
              borderColor={colors.border}
              timeZoneMode={timeZoneMode}
              onTimeZoneChange={(mode) => setTimeZoneMode(mode)}
            />
          </View>
        </View>

        {/* 🤖 2. AI 独家异动点评基座 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🤖 {t('aiOpinion')}</Text>
          <View style={[styles.aiQuoteBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.aiText, { color: colors.textPrimary }]}>
              {radarMeta ? t(radarMeta.reasonKey) : t('reason_whale')}
            </Text>
          </View>
        </View>

        {/* 📰 3. 近期咨询新闻流 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📰 {t('newsTitle')}</Text>
          <View style={styles.newsItem}>
            <Text style={[styles.newsMeta, { color: colors.textSecondary }]}>Nikkei Biz • 2小时前</Text>
            <Text style={[styles.newsText, { color: colors.textPrimary }]}>
              东京主力资金清晨急剧增仓该股，疑似与下季度大中华区供应链财报预期大幅调高有关。
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.newsItem}>
            <Text style={[styles.newsMeta, { color: colors.textSecondary }]}>Bloomberg JP • 昨日</Text>
            <Text style={[styles.newsText, { color: colors.textPrimary }]}>
              大宗交易流系统（Block Trade Tracker）显示，海外挪威主权基金在 13,000 日元附近录得持续性被动买盘。
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15, gap: 15 },
  title: { fontSize: 16, fontWeight: '800', fontFamily: 'monospace' },
  scrollBody: { paddingHorizontal: 20, gap: 15, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 18, borderWidth: 1 },
  stockName: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  chartWrapper: { minHeight: 220, justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12, letterSpacing: 0.5 },
  aiQuoteBox: { padding: 14, borderRadius: 10, borderWidth: 1, borderLeftWidth: 4, borderLeftColor: '#30D158' },
  aiText: { fontSize: 12, lineHeight: 20, fontWeight: '600' },
  newsItem: { paddingVertical: 4 },
  newsMeta: { fontSize: 9, fontFamily: 'monospace', fontWeight: '600' },
  newsText: { fontSize: 12, marginTop: 4, lineHeight: 18 },
  divider: { height: 1, marginVertical: 12 }
});