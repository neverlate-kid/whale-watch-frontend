import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useMarketData } from '@/hooks/useMarketData';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function FavoritesScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { favorites, toggleFavorite } = useAppUser();
  const router = useRouter();

  // 🌟 新增状态：用于记录当前正在展开“移除”操作的股票 Ticker
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // 🌟 后端底座数据与加载状态
  const [baseStocks, setBaseStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 S3 实时高频数据
  const { data: realTimeData } = useMarketData(60000);

  useEffect(() => {
    const fetchBaseData = async () => {
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
        if (json.success) setBaseStocks(json.data);
      } catch (e) {
        console.error("加载收藏底座数据失败:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBaseData();
  }, []);

  // 🌟 核心引擎：将用户收藏列表 + 后端底座数据 + S3实时数据 进行完美融合
  const displayFavorites = useMemo(() => {
    return favorites.map(ticker => {
      // 先找底座数据，如果没找到给个默认值
      const base = baseStocks.find(s => s.ticker === ticker) || { ticker, price: 0, prev_price: 0, change: '0.00' };
      const s3Info = realTimeData?.stocks?.[ticker];

      // 融合实时价格：如果有 S3 数据用 S3 的，否则降级用后端的
      const livePrice = s3Info?.price || base.price;
      const prevPrice = base.prev_price || base.price;

      // 在前端内存里瞬间计算真实的实时涨跌幅
      const diff = livePrice - prevPrice;
      const isUp = prevPrice ? diff >= 0 : true;
      const pctStr = prevPrice ? ((diff / prevPrice) * 100).toFixed(2) : '0.00';

      return {
        ticker,
        livePrice,
        liveChange: (isUp ? '+' : '') + diff.toFixed(2) + ` (${pctStr}%)`,
        isUp
      };
    });
  }, [favorites, baseStocks, realTimeData]);

  const getLocalizedName = (ticker: string) => {
    const info = NIKKEI_225_DICT[ticker];
    if (!info) return ticker;
    const lang = i18n.language.substring(0, 2) as keyof typeof info;
    return (info as any)[lang] || info.en;
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
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('favoritesTitle')}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.textPrimary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={displayFavorites}
          keyExtractor={(item) => item.ticker}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 40, opacity: 0.5, marginBottom: 15 }}>💎</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('emptyFavorites')}
              </Text>
            </View>
          )}
          renderItem={({ item: stock }) => {
            const isDeleting = deleteTarget === stock.ticker;

            return (
              <TouchableOpacity
                style={[styles.stripCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => {
                  // 🌟 核心防误触：如果当前处于展开删除状态，点击卡片任意位置即可“取消删除”
                  if (isDeleting) {
                    setDeleteTarget(null);
                  } else {
                    router.push(`/detail/${stock.ticker}`);
                  }
                }}
              >
                <View style={styles.leftCol}>
                  {isDeleting ? (
                    // 🚨 展开状态：红色显眼移除按钮
                    <TouchableOpacity
                      onPress={() => {
                        toggleFavorite(stock.ticker);
                        setDeleteTarget(null); // 移除后清空状态
                      }}
                      activeOpacity={0.8}
                      style={styles.deleteToggleBtn}
                    >
                      {/* 优雅复用了多语言翻译中的 "移除/Remove" */}
                      <Text style={styles.deleteToggleText}>{t('removeFavConfirmTitle')}</Text>
                    </TouchableOpacity>
                  ) : (
                    // 💎 正常状态：水晶图标触发器
                    <TouchableOpacity
                      onPress={() => setDeleteTarget(stock.ticker)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.diamondBtn}
                    >
                      <Text style={{ fontSize: 18 }}>💎</Text>
                    </TouchableOpacity>
                  )}

                  <View>
                    <Text style={[styles.tickerText, { color: colors.textPrimary }]}>{stock.ticker}</Text>
                    <Text style={[styles.nameText, { color: colors.textSecondary }]}>{getLocalizedName(stock.ticker)}</Text>
                  </View>
                </View>

                <View style={styles.rightCol}>
                  <Text style={[styles.priceText, { color: colors.textPrimary }]}>¥{stock.livePrice.toLocaleString()}</Text>
                  <Text style={[styles.changeText, { color: stock.isUp ? '#30D158' : '#FF453A' }]}>{stock.liveChange}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  diamondBtn: { padding: 4, marginRight: 4 },

  // 🌟 新增的内嵌删除按钮样式
  deleteToggleBtn: { backgroundColor: '#FF453A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 4, justifyContent: 'center', alignItems: 'center' },
  deleteToggleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  tickerText: { fontSize: 14, fontWeight: '800', fontFamily: 'monospace' },
  nameText: { fontSize: 11, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', flex: 0.35 },
  priceText: { fontSize: 15, fontWeight: '900', fontFamily: 'monospace' },
  changeText: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 20 }
});