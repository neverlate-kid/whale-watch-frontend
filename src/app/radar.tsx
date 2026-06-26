import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context'; // 🚀 引入会员判断
import { mockRadarList } from '@/constants/mock-stock';
import { useTranslation } from 'react-i18next';

export default function RadarScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { isPremium } = useAppUser(); // 🚀 获取会员状态
  const router = useRouter();

  // 🔒 核心变现逻辑：非会员强行限制前5条展示 (这里我们的Mock数组较短，但逻辑完全打通)
  const displayData = isPremium ? mockRadarList : mockRadarList.slice(0, 2); 

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBarStyle} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>◀</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('radarTitle')}</Text>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.ticker}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={() => (
          // 🔒 核心改动：非会员在页尾弹出充值引流文案
          !isPremium ? (
            <View style={[styles.premiumNoticeBox, { backgroundColor: '#FFD70015', borderColor: '#FFD700' }]}>
              <Text style={[styles.noticeText, { color: colors.textPrimary }]}>⚠️ {t('premiumNotice')}</Text>
              <TouchableOpacity style={styles.upgradeInlineBtn} onPress={() => router.push('/profile')}>
                <Text style={styles.upgradeInlineText}>{t('upgradeBtn')}</Text>
              </TouchableOpacity>
            </View>
          ) : null
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.stripCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7} onPress={() => router.push(`/detail/${item.ticker}`)}>
            <View style={styles.leftCol}>
              <View style={[styles.scoreBadge, { backgroundColor: item.isUp ? '#30D15820' : '#FF453A20', borderColor: item.isUp ? '#30D158' : '#FF453A' }]}>
                <Text style={{ color: item.isUp ? '#30D158' : '#FF453A', fontSize: 10, fontWeight: '900' }}>{item.score} 🔥</Text>
              </View>
              <View>
                <Text style={[styles.tickerText, { color: colors.textPrimary }]}>{item.ticker}</Text>
                <Text style={[styles.nameText, { color: colors.textSecondary }]}>{t(item.nameKey)}</Text>
              </View>
            </View>
            <View style={styles.rightCol}>
              <Text style={[styles.priceText, { color: colors.textPrimary }]}>{item.price}</Text>
              <Text style={[styles.changeText, { color: item.isUp ? '#30D158' : '#FF453A' }]}>{item.change}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 15 },
  title: { fontSize: 18, fontWeight: '900' },
  listContainer: { paddingHorizontal: 20, gap: 10, paddingBottom: 40 },
  stripCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  leftCol: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 0.65 },
  scoreBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  tickerText: { fontSize: 14, fontWeight: '800', fontFamily: 'monospace' },
  nameText: { fontSize: 11, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', flex: 0.35 },
  priceText: { fontSize: 15, fontWeight: '900', fontFamily: 'monospace' },
  changeText: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  
  // 充值引流卡片样式
  premiumNoticeBox: { marginTop: 20, padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 12 },
  noticeText: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  upgradeInlineBtn: { backgroundColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  upgradeInlineText: { color: '#000', fontSize: 11, fontWeight: '900' }
});