import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Platform, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

// 🌟 引入独立封装的统一登录组件
import { LoginModal } from '@/components/login-modal';

export default function RadarScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { isPremium, isLoggedIn } = useAppUser(); 
  const router = useRouter();

  // 控制雷达页自己的登录弹窗状态
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  // 状态管理
  const [radarData, setRadarData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasAccess = isLoggedIn && isPremium;

  useEffect(() => {
    const fetchRadarData = async () => {
      setIsLoading(true);
      try {
        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/api/v1/stocks`);
        const json = await response.json();
        
        if (json.success && Array.isArray(json.data)) {
          // 后端取回全量数据后，按 volatility_score 排序
          const sorted = [...json.data].sort((a, b) => b.volatility_score - a.volatility_score);
          setRadarData(sorted);
        }
      } catch (e) {
        console.error("加载雷达数据失败:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRadarData();
  }, []);

  // 根据权限截取数组
  const displayData = hasAccess ? radarData : radarData.slice(0, 5);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  const handleBottomAction = () => {
      if (!isLoggedIn) {
          // 🌟 唤起精美的全局复用登录组件
          setLoginModalVisible(true);
      } else {
          router.push('/profile');
      }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('radarTitle')}</Text>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.ticker}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={() => (
          !hasAccess ? (
            <View style={[styles.premiumCapsule, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.premiumLeft}>
                    <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>
                        {isLoggedIn ? t('premiumTitle') : `🔐 ${t('loginEntry')}`}
                    </Text>
                    <Text style={[styles.premiumSub, { color: colors.textSecondary }]}>
                        {isLoggedIn ? t('premiumNotice') : t('loginSubtitle')}
                    </Text>
                </View>
                
                <TouchableOpacity 
                    style={[styles.premiumBadge, { backgroundColor: colors.textPrimary }]} 
                    onPress={handleBottomAction}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.premiumBadgeText, { color: colors.background }]}>
                        {isLoggedIn ? t('upgradeBtn') : t('loginEntry')}
                    </Text>
                </TouchableOpacity>
            </View>
          ) : null
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.stripCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7} onPress={() => router.push(`/detail/${item.ticker}`)}>
            <View style={styles.leftCol}>
              <View style={[styles.scoreBadge, { backgroundColor: item.isUp ? '#30D15820' : '#FF453A20', borderColor: item.isUp ? '#30D158' : '#FF453A' }]}>
                <Text style={{ color: item.isUp ? '#30D158' : '#FF453A', fontSize: 10, fontWeight: '900' }}>
                  {item.volatility_score.toFixed(1)} 🔥
                </Text>
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

      {/* 🌟 渲染复用的登录组件 */}
      <LoginModal 
        visible={loginModalVisible} 
        onClose={() => setLoginModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 4 }, 
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 8, gap: 15 },
  backCapsule: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 1, elevation: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  listContainer: { paddingHorizontal: 20, gap: 10, paddingBottom: 40 },
  stripCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
  leftCol: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 0.65 },
  scoreBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  tickerText: { fontSize: 14, fontWeight: '800', fontFamily: 'monospace' },
  nameText: { fontSize: 11, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', flex: 0.35 },
  priceText: { fontSize: 15, fontWeight: '900', fontFamily: 'monospace' },
  changeText: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  premiumCapsule: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, padding: 16, borderWidth: 1, marginTop: 10 },
  premiumLeft: { flex: 1, gap: 4, paddingRight: 10 },
  premiumTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  premiumSub: { fontSize: 10, fontWeight: '500', lineHeight: 14 },
  premiumBadge: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  premiumBadgeText: { fontSize: 10, fontWeight: '900' }
});