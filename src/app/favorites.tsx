import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { useMarketData } from '@/hooks/useMarketData';

export default function FavoritesScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { favorites, toggleFavorite } = useAppUser(); 
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  
  // 替换掉 mockStockData 的真实基础数据池
  const [baseStocks, setBaseStocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 挂载 S3 全局实时钩子
  const { data: realTimeData } = useMarketData(60000);

  // 1. 从你的 FastAPI 拉取基础股票字典
  useEffect(() => {
    const fetchBaseData = async () => {
      setIsLoading(true);
      try {
        const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
        const response = await fetch(`${baseUrl}/api/v1/stocks`);
        const json = await response.json();
        if (json.success) {
          setBaseStocks(json.data);
        }
      } catch (e) {
        console.error("加载基础数据失败:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBaseData();
  }, []);

  // 2. 🌟 核心融合：将 Context 中的 favorites 数组转换为真实的 UI 渲染数据
  const displayFavorites = useMemo(() => {
    return favorites.map(ticker => {
      const base = baseStocks.find(s => s.ticker === ticker) || { ticker, price: 0, change: 0 };
      const s3Info = realTimeData?.stocks?.[ticker];
      
      const livePrice = s3Info?.price || base.price;
      const diff = livePrice - base.price;
      const isUp = base.price ? diff >= 0 : true;
      const changeStr = base.price ? ((diff / base.price) * 100).toFixed(2) + '%' : '0.00%';

      return {
        ticker,
        livePrice,
        liveChange: (isUp ? '+' : '') + changeStr,
        isUp
      };
    });
  }, [favorites, baseStocks, realTimeData]);

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
                      if (isDeleting) {
                          setDeleteTarget(null);
                      } else {
                          router.push(`/detail/${stock.ticker}`);
                      }
                  }}
              >
                <View style={styles.leftCol}>
                  {isDeleting ? (
                      <TouchableOpacity 
                          onPress={() => {
                              toggleFavorite(stock.ticker);
                              setDeleteTarget(null); 
                          }}
                          activeOpacity={0.8}
                          style={styles.deleteToggleBtn}
                      >
                          <Text style={styles.deleteToggleText}>{t('removeFavConfirmTitle')}</Text>
                      </TouchableOpacity>
                  ) : (
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