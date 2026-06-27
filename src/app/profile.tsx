import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { colors, theme } = useAppTheme();
    const { username, isPremium, togglePremium, updateUsername } = useAppUser(); // 已移除 favorites 和 logout
    const router = useRouter();

    const [inputName, setInputName] = useState(username);
    const [isEditing, setIsEditing] = useState(false);

    const mockJoinDate = '2026-01-15';
    const mockExpiryDate = '2027-01-15';

    const handleSave = () => {
        if (!inputName.trim()) {
            Alert.alert(t('errorTitle'), t('username') + ' cannot be empty');
            return;
        }
        updateUsername(inputName);
        setIsEditing(false);
    };

    const handlePasswordChangePress = () => {
        Alert.alert(t('errorTitle'), 'Password change trigger modal or flow here.');
    };

    const handleUpgradePress = () => {
        Alert.alert(
            t('iapSimulateTitle'),
            t('iapSimulateMsg'),
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: t('iapPayBtn'), 
                    onPress: () => {
                        togglePremium();
                        Alert.alert(t('iapSuccessTitle'), t('iapSuccessMsg'));
                    }
                }
            ]
        );
    };

    const handleCancelSubscription = () => {
        Alert.alert(
            t('cancelConfirmTitle'),
            t('cancelConfirmMessage'),
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: t('confirmBtn'), 
                    style: 'destructive',
                    onPress: () => {
                        togglePremium();
                        Alert.alert(t('cancelSuccessTitle'), t('cancelSuccess'));
                    }
                }
            ]
        );
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
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.settingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('username')}</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                                    value={inputName}
                                    onChangeText={setInputName}
                                    autoFocus
                                />
                            ) : (
                                <Text style={[styles.nameText, { color: colors.textPrimary }]}>{username}</Text>
                            )}
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.miniBtn, { backgroundColor: isEditing ? colors.textPrimary : colors.background, borderColor: colors.border, borderWidth: isEditing ? 0 : 1 }]} 
                            onPress={isEditing ? handleSave : () => setIsEditing(true)}
                        >
                            <Text style={{ color: isEditing ? colors.background : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>
                                {isEditing ? t('saveProfile') : t('editProfile')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('emailLabel')}</Text>
                            <Text style={[styles.staticValueText, { color: colors.textSecondary }]}>user***@gmail.com</Text>
                        </View>
                    </View>

                    <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity style={[styles.settingRow, { paddingVertical: 4 }]} onPress={handlePasswordChangePress} activeOpacity={0.6}>
                        <View>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('passwordLabel')}</Text>
                            <Text style={[styles.staticValueText, { color: colors.textPrimary }]}>••••••••••••</Text>
                        </View>
                        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <Path d="M9 5l7 7-7 7" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </Svg>
                    </TouchableOpacity>
                </View>

                {isPremium ? (
                    <View style={[styles.premiumManagerCard, { backgroundColor: colors.card, borderColor: '#D4A373' }]}>
                        <View style={styles.managerHeader}>
                            <Text style={[styles.managerTitle, { color: '#D4A373' }]}>{t('premiumActive')}</Text>
                        </View>
                        <View style={[styles.innerDivider, { backgroundColor: colors.border, marginVertical: 10 }]} />
                        <View style={styles.infoMetaRow}>
                            <View style={styles.metaColumn}>
                                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t('premiumJoinDate')}</Text>
                                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{mockJoinDate}</Text>
                            </View>
                            <View style={styles.metaColumn}>
                                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t('premiumExpiryDate')}</Text>
                                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{mockExpiryDate}</Text>
                            </View>
                        </View>

                        <View style={{ gap: 8 }}>
                            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={handleCancelSubscription} activeOpacity={0.7}>
                                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t('cancelSubscription')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.premiumCapsule, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.premiumLeft}>
                            <Text style={[styles.premiumTitle, { color: colors.textPrimary }]}>{t('premiumTitle')}</Text>
                            <Text style={[styles.premiumSub, { color: colors.textSecondary }]}>{t('upgradeSub')}</Text>
                        </View>
                        <TouchableOpacity style={[styles.premiumBadge, { backgroundColor: colors.textPrimary }]} onPress={handleUpgradePress} activeOpacity={0.8}>
                            <Text style={[styles.premiumBadgeText, { color: colors.background }]}>{t('upgradeBtn')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 4 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginVertical: 8 },
    backCapsule: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 1, elevation: 1 },
    body: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
    card: { borderRadius: 14, padding: 16, borderWidth: 1 },
    innerDivider: { height: 1, marginVertical: 12 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
    input: { height: 32, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, fontSize: 14, fontWeight: '600', marginTop: 2 },
    nameText: { fontSize: 15, fontWeight: '800' },
    staticValueText: { fontSize: 14, fontWeight: '600' },
    miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    premiumCapsule: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, padding: 16, borderWidth: 1, marginTop: 2 },
    premiumLeft: { flex: 1, gap: 2, paddingRight: 10 },
    premiumTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
    premiumSub: { fontSize: 10, fontWeight: '500' },
    premiumBadge: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    premiumBadgeText: { fontSize: 10, fontWeight: '900' },
    premiumManagerCard: { borderRadius: 14, padding: 16, borderWidth: 1.5, marginTop: 2 },
    managerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    managerTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.3 },
    infoMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 2 },
    metaColumn: { flex: 1, gap: 3 },
    metaLabel: { fontSize: 10, fontWeight: '700' },
    metaValue: { fontSize: 13, fontWeight: '800', fontFamily: 'monospace' },
    cancelBtn: { width: '100%', height: 36, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', marginTop: 4 },
    cancelBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});