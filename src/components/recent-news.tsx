import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/context/theme-context';
import dayjs from 'dayjs';
import * as WebBrowser from 'expo-web-browser';

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  publishTime: number;
}

interface RecentNewsProps {
  news: NewsItem[];
}

export function RecentNews({ news }: RecentNewsProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  // 🌟 封装在组件内部的浏览器唤起逻辑
  const handleOpenNews = async (url: string) => {
    if (!url) return;
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: colors.textPrimary,
      toolbarColor: colors.card,
    });
  };

  return (
    <View style={styles.newsSection}>
      <Text style={[styles.newsSectionTitle, { color: colors.textPrimary }]}>
        {t('recentNews', '近期相关资讯')}
      </Text>
      
      {news.length === 0 ? (
        <View style={[styles.noNewsCard, { borderColor: colors.border }]}>
           <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
             {t('noNewsFound', '暂无近期资讯')}
           </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {news.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.newsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => handleOpenNews(item.link)}
            >
              <Text style={[styles.newsTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.newsMetaRow}>
                <Text style={[styles.newsPublisher, { color: colors.textPrimary }]}>
                  {item.publisher}
                </Text>
                <Text style={[styles.newsTime, { color: colors.textSecondary }]}>
                  {dayjs(item.publishTime * 1000).format('MM-DD HH:mm')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  newsSection: { paddingHorizontal: 20, marginTop: 24 },
  newsSectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  noNewsCard: { padding: 20, borderWidth: 1, borderRadius: 12, borderStyle: 'dashed', alignItems: 'center' },
  newsCard: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  newsTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  newsMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  newsPublisher: { fontSize: 10, fontWeight: '900', backgroundColor: '#F4D06830', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  newsTime: { fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },
});