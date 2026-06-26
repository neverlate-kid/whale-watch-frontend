import { mockStockData } from '@/constants/mock-stock';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const { username, isPremium, favorites, togglePremium, updateUsername, logout } = useAppUser();
    const router = useRouter();

    const [inputName, setInputName] = useState(username);
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        updateUsername(inputName);
        setIsEditing(false);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={colors.statusBarStyle} />

            {/* 头部导航 */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>◀</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{isPremium ? `👑 ${t('premiumUser')}` : `👤 ${t('freeUser')}`}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* 💳 资料修改卡片 */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{t('username')}</Text>
                    {isEditing ? (
                        <View style={styles.editRow}>
                            <TextInput
                                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                                value={inputName}
                                onChangeText={setInputName}
                            />
                            <TouchableOpacity style={[styles.miniBtn, { backgroundColor: colors.textPrimary }]} onPress={handleSave}>
                                <Text style={{ color: colors.background, fontSize: 11, fontWeight: '800' }}>{t('saveProfile')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.editRow}>
                            <Text style={[styles.nameText, { color: colors.textPrimary }]}>{username}</Text>
                            <TouchableOpacity style={[styles.miniBtn, { backgroundColor: colors.border }]} onPress={() => setIsEditing(true)}>
                                <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>{t('editProfile')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* 💎 充值变现大本营 */}
                <TouchableOpacity
                    style={[styles.premiumCard, { backgroundColor: isPremium ? '#443300' : '#FFD700', borderColor: '#FFD700' }]}
                    onPress={togglePremium}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.premiumTitle, { color: isPremium ? '#FFD700' : '#000' }]}>
                        {isPremium ? '✓ PREMIUM ACTIVE' : t('upgradeBtn')}
                    </Text>
                    <Text style={[styles.premiumSub, { color: isPremium ? '#FFD700AA' : '#333' }]}>
                        {isPremium ? '点击可体验降级切换测试' : '解锁全量日经大庄操盘雷达 + 会员专属收藏功能'}
                    </Text>
                </TouchableOpacity>

                {/* ❤️ 动态收藏夹展示 */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>❤️ {t('myFavorites')}</Text>

                {favorites.length === 0 ? (
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontStyle: 'italic', paddingLeft: 4 }}>Empty Watchlist</Text>
                ) : (
                    favorites.map(ticker => {
                        const stock = mockStockData[ticker];
                        if (!stock) return null;
                        return (
                            <TouchableOpacity
                                key={ticker}
                                style={[styles.stripCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => router.push(`/detail/${ticker}`)}
                            >
                                <Text style={[styles.stripTicker, { color: colors.textPrimary }]}>{ticker}</Text>
                                <Text style={{ color: stock.isUp ? '#30D158' : '#FF453A', fontSize: 14, fontWeight: '700', fontFamily: 'monospace' }}>
                                    ¥{stock.price.toLocaleString()} ({stock.change})
                                </Text>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 15 },
    title: { fontSize: 16, fontWeight: '800' },
    body: { paddingHorizontal: 20, gap: 15 },
    card: { borderRadius: 12, padding: 16, borderWidth: 1 },
    label: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
    editRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
    input: { flex: 1, height: 32, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, fontSize: 13 },
    nameText: { fontSize: 16, fontWeight: '800' },
    miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },

    premiumCard: { borderRadius: 12, padding: 18, borderWidth: 1, alignItems: 'center', marginVertical: 5 },
    premiumTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    premiumSub: { fontSize: 10, marginTop: 4, textAlign: 'center', fontWeight: '500' },

    sectionTitle: { fontSize: 14, fontWeight: '800', marginTop: 10 },
    stripCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
    stripTicker: { fontSize: 14, fontWeight: '800', fontFamily: 'monospace' }
});