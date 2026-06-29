import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// 引入全局登录组件与 S3 实时数据 Hook
import { LoginModal } from '@/components/login-modal';
import { useMarketData } from '@/hooks/useMarketData';

export default function RadarScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { isPremium, isLoggedIn } = useAppUser();
  const router = useRouter();

  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasAccess = isLoggedIn && isPremium;

  // 🌟 挂载全局 S3 实时引擎
  const { data: realTimeData } = useMarketData(60000);

  useEffect(() => {
    const fetchRadarData = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!baseUrl) {
          console.warn("⚠️ 未配置后端 API 环境变量 (EXPO_PUBLIC_API_URL)");
          setIsLoading(false);
          return;
        }
        const response = await fetch(`${baseUrl}/api/v1/stocks`);
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
          setRadarData(json.data);
        }
      } catch (e) {
        console.error("加载雷达数据失败:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRadarData();
  }, []);

  // 🌟 核心引擎：融合 S3 数据并实时动态重新排序 (异动越大的自动排上面)
  const displayData = useMemo(() => {
    const mergedData = radarData.map(item => {
      const s3Info = realTimeData?.stocks?.[item.ticker];

      // 如果没有 S3 数据，回退到后端的历史数据
      if (!s3Info) {
        return { ...item, livePrice: item.price, liveChange: item.change };
      }

      const livePrice = s3Info.price;
      const prevPrice = item.prev_price || item.price; // 用后端的昨收价计算基准
      const diff = livePrice - prevPrice;
      const pct = prevPrice ? (diff / prevPrice) * 100 : 0;
      const isUp = diff >= 0;

      return {
        ...item,
        livePrice,
        isUp,
        liveChange: `${isUp ? '+' : ''}${diff.toFixed(2)} (${pct.toFixed(2)}%)`,
        volatility_score: Math.abs(pct) // 实时刷新异动指数
      };
    });

    // 重新排序并按权限截取
    const sorted = mergedData.sort((a, b) => b.volatility_score - a.volatility_score);
    return hasAccess ? sorted : sorted.slice(0, 5);
  }, [radarData, realTimeData, hasAccess]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
      </View>
    );
  }

  const handleBottomAction = () => {
    if (!isLoggedIn) {
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
                <Text style={[styles.tickerText, { color: colors.textPrimary }]}>
                  {(() => {
                    const info = NIKKEI_225_DICT[item.ticker];
                    if (!info) return item.ticker;
                    const lang = i18n.language.substring(0, 2) as keyof typeof info;
                    return (info as any)[lang] || info.en;
                  })()}
                </Text>
                <Text style={[styles.nameText, { color: colors.textSecondary }]}>{t(item.ticker)}</Text>
              </View>
            </View>
            <View style={styles.rightCol}>
              <Text style={[styles.priceText, { color: colors.textPrimary }]}>¥{item.livePrice?.toLocaleString()}</Text>
              <Text style={[styles.changeText, { color: item.isUp ? '#30D158' : '#FF453A' }]}>{item.liveChange}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

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