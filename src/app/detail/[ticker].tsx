import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppTheme } from '@/context/theme-context';
import { mockStockData } from '@/constants/mock-stock';
import { StockChart } from '@/components/stock-chart';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

export default function DetailScreen() {
  const { ticker } = useLocalSearchParams<{ ticker: string }>();
  const { t, i18n } = useTranslation();
  const { colors, theme } = useAppTheme();
  const router = useRouter();

  const [timeZoneMode, setTimeZoneMode] = useState<'JST' | 'local'>('JST');
  
  const currentTicker = ticker || '9983';
  const stock = mockStockData[currentTicker] || mockStockData['9983'];

  // 📰 模拟从后端拉取的实时流式数据 (技术解耦示范)
  // 在真实场景中，这一块数据将通过 useEffect 发起 fetch(`api/news?ticker=${ticker}&lang=${i18n.language}`) 获得
  const mockBackendNewsStream = [
    {
      id: 'news_01',
      source: 'Nikkei Biz',
      timeText: `2 ${i18n.language === 'zh' ? '小时前' : i18n.language === 'ja' ? '時間前' : i18n.language === 'ko' ? '시간 전' : 'hours ago'}`,
      content: {
        zh: "东京主力资金清晨急剧增仓该股，疑似与下季度大中华区供应链财报预期大幅调高有关。",
        en: "Tokyo's institutional smart money significantly increased positions this morning, likely tied to sharp upward revisions in next quarter's Greater China supply chain earnings outlook.",
        ja: "東京の機関投資家マネーが今朝急激に買い増し。次四半期の中華圏サプライチェーンの業績見通しの大幅な引き上げに関係している模様。",
        ko: "도쿄 기관 자금이 오늘 아침 급격히 매수세를 확대했습니다. 다음 분기 중화권 공급망 실적 전망치의 대폭 상향 조정과 관련된 것으로 추정됩니다."
      }
    },
    {
      id: 'news_02',
      source: 'Bloomberg JP',
      timeText: i18n.language === 'zh' ? '昨日' : i18n.language === 'ja' ? '昨日' : i18n.language === 'ko' ? '어제' : 'Yesterday',
      content: {
        zh: "大宗交易流系统（Block Trade Tracker）显示，海外挪威主权基金在关键支撑位附近录得持续性被动买盘。",
        en: "The Block Trade Tracker indicates that overseas Norway Sovereign Wealth Funds are logging continuous passive buy orders near key support levels.",
        ja: "大口ブロックトレード追跡システムによると、海外のノルウェー政府年金基金が主要なサポートライン付近で継続的なパッシブ買いを記録しています。",
        ko: "대량 체결 추적 시스템(Block Trade Tracker)에 따르면, 해외 노르웨이 국권기금이 핵심 지지선 부근에서 지속적인 패시브 매수세를 기록하고 있습니다."
      }
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />
      
      {/* 🎯 头部导航：高度缩紧且与 profile 页面的 SVG 胶囊按钮完全对齐 */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={[styles.backCapsule, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <Path 
                    d="M15 19L8 12L15 5" 
                    stroke={colors.textPrimary} 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                />
            </Svg>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{stock ? t(stock.nameKey) : ticker}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* 1. 图表看板区 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tickerCode, { color: colors.textPrimary }]}>{currentTicker}</Text>
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

        {/* 📰 2. 近期咨询新闻流（已进行架构级防硬编码动态解耦） */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📰 {t('newsTitle')}</Text>
          
          {mockBackendNewsStream.map((news, index) => {
            // 根据当前 i18n 选取的语种动态加载对应的语言内容，如果缺失则退化兜底到英文版本
            const localizedContent = news.content[i18n.language as 'zh' | 'en' | 'ja' | 'ko'] || news.content['en'];
            
            return (
              <View key={news.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.newsItem}>
                  <Text style={[styles.newsMeta, { color: colors.textSecondary }]}>
                    {news.source} • {news.timeText}
                  </Text>
                  <Text style={[styles.newsText, { color: colors.textPrimary }]}>
                    {localizedContent}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 💡 高度紧缩，完美承接全局公用 Header，保持全站距离视觉一致
  container: { flex: 1, paddingTop: 4 },
  
  // 精美胶囊 Header 组
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 8, gap: 15 },
  backCapsule: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 1, elevation: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  
  scrollBody: { paddingHorizontal: 20, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 14, padding: 18, borderWidth: 1 },
  tickerCode: { fontSize: 20, fontWeight: '900', fontFamily: 'monospace', marginBottom: 10 },
  chartWrapper: { minHeight: 220, justifyContent: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '800', marginBottom: 12, letterSpacing: 0.2 },
  
  newsItem: { paddingVertical: 2 },
  newsMeta: { fontSize: 10, fontFamily: 'monospace', fontWeight: '700' },
  newsText: { fontSize: 12, marginTop: 5, lineHeight: 19, fontWeight: '500' },
  divider: { height: 1, marginVertical: 14 }
});