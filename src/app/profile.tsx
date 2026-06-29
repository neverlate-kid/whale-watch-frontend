import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '@/lib/supabase'; // 引入 supabase

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { colors, theme } = useAppTheme();
    const { username, isPremium, togglePremium, updateUsername, session } = useAppUser(); 
    const router = useRouter();

    // 用户名编辑状态
    const [inputName, setInputName] = useState(username);
    const [isEditingName, setIsEditingName] = useState(false);

    // 🌟 新增：密码修改状态
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

    const joinDate = useMemo(() => {
        if (session?.user?.created_at) {
            return dayjs(session.user.created_at).format('YYYY-MM-DD');
        }
        return 'N/A';
    }, [session]);

    const expiryDate = isPremium ? dayjs().add(1, 'year').format('YYYY-MM-DD') : t('notSubscribed');

    const handleSaveName = () => {
        if (!inputName.trim()) {
            Alert.alert(t('errorTitle', '提示'), t('usernameEmptyError', '用户名不能为空')); 
            return;
        }
        updateUsername(inputName);
        setIsEditingName(false);
    };

    // 🌟 新增：复用严格的密码校验
    const validatePassword = (): boolean => {
        if (newPassword.length < 8) {
            Alert.alert(t('errorTitle'), t('passwordTooShort')); return false;
        }
        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
            Alert.alert(t('errorTitle'), t('passwordNeedCase')); return false;
        }
        if (!/[0-9]/.test(newPassword)) {
            Alert.alert(t('errorTitle'), t('passwordNeedNumber')); return false;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
            Alert.alert(t('errorTitle'), t('passwordNeedSpecial')); return false;
        }
        if (newPassword !== confirmNewPassword) {
            Alert.alert(t('errorTitle'), t('passwordMismatch')); return false;
        }
        return true;
    };

    // 🌟 新增：提交密码修改到 Supabase
    const handleSavePassword = async () => {
        if (!validatePassword()) return;
        if (!supabase) return;

        setIsUpdatingPwd(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            
            Alert.alert(t('noticeTitle', '提示'), t('passwordUpdated', '密码修改成功'));
            setIsEditingPassword(false);
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error: any) {
            Alert.alert(t('errorTitle', '提示'), error.message || t('passwordUpdateFailed'));
        } finally {
            setIsUpdatingPwd(false);
        }
    };

    const handleUpgradePress = () => {
        Alert.alert(t('iapSimulateTitle'), t('iapSimulateMsg'), [
            { text: t('cancelBtn', '取消'), style: 'cancel' },
            { 
                text: t('iapPayBtn'), 
                onPress: () => { togglePremium(); Alert.alert(t('iapSuccessTitle'), t('iapSuccessMsg')); }
            }
        ]);
    };

    const handleCancelSubscription = () => {
        Alert.alert(t('cancelConfirmTitle'), t('cancelConfirmMessage'), [
            { text: t('cancelBtn', '取消'), style: 'cancel' },
            { 
                text: t('confirmBtn'), style: 'destructive',
                onPress: () => { togglePremium(); Alert.alert(t('cancelSuccessTitle'), t('cancelSuccess')); }
            }
        ]);
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
                    
                    {/* 用户名栏 */}
                    <View style={styles.settingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('username')}</Text>
                            {isEditingName ? (
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
                            style={[styles.miniBtn, { backgroundColor: isEditingName ? colors.textPrimary : colors.background, borderColor: colors.border, borderWidth: isEditingName ? 0 : 1 }]} 
                            onPress={isEditingName ? handleSaveName : () => setIsEditingName(true)}
                        >
                            <Text style={{ color: isEditingName ? colors.background : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>
                                {isEditingName ? t('saveProfile', '保存') : t('editProfile', '编辑')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

                    {/* 邮箱栏 */}
                    <View style={styles.settingRow}>
                        <View>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('emailLabel')}</Text>
                            <Text style={[styles.staticValueText, { color: colors.textSecondary }]}>
                                {session?.user?.email || t('notLoggedIn', '未登录')}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

                    {/* 🌟 核心新增：密码修改折叠面板 */}
                    <View style={{ gap: 8 }}>
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('passwordLabel')}</Text>
                                {!isEditingPassword && <Text style={[styles.staticValueText, { color: colors.textPrimary }]}>••••••••••••</Text>}
                            </View>
                            {!isEditingPassword && (
                                <TouchableOpacity 
                                    style={[styles.miniBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]} 
                                    onPress={() => setIsEditingPassword(true)}
                                >
                                    <Text style={{ color: colors.textPrimary, fontSize: 11, fontWeight: '700' }}>
                                        {t('changePassword', '修改密码')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {isEditingPassword && (
                            <View style={{ gap: 10, marginTop: 4 }}>
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                                    placeholder={t('newPassword', '新密码')}
                                    placeholderTextColor={colors.textSecondary}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    editable={!isUpdatingPwd}
                                />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                                    placeholder={t('confirmNewPassword', '确认新密码')}
                                    placeholderTextColor={colors.textSecondary}
                                    value={confirmNewPassword}
                                    onChangeText={setConfirmNewPassword}
                                    secureTextEntry
                                    editable={!isUpdatingPwd}
                                />
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { flex: 1, backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]} 
                                        onPress={() => { setIsEditingPassword(false); setNewPassword(''); setConfirmNewPassword(''); }}
                                        disabled={isUpdatingPwd}
                                    >
                                        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>{t('cancelBtn', '取消')}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { flex: 1, backgroundColor: colors.textPrimary }]} 
                                        onPress={handleSavePassword}
                                        disabled={isUpdatingPwd}
                                    >
                                        {isUpdatingPwd ? <ActivityIndicator size="small" color={colors.background} /> : (
                                            <Text style={{ color: colors.background, fontSize: 12, fontWeight: '700' }}>{t('saveProfile', '保存')}</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* 订阅管理区域保持不变 */}
                {isPremium ? (
                    <View style={[styles.premiumManagerCard, { backgroundColor: colors.card, borderColor: '#D4A373' }]}>
                        <View style={styles.managerHeader}>
                            <Text style={[styles.managerTitle, { color: '#D4A373' }]}>{t('premiumActive')}</Text>
                        </View>
                        <View style={[styles.innerDivider, { backgroundColor: colors.border, marginVertical: 10 }]} />
                        <View style={styles.infoMetaRow}>
                            <View style={styles.metaColumn}>
                                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t('premiumJoinDate')}</Text>
                                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{joinDate}</Text>
                            </View>
                            <View style={styles.metaColumn}>
                                <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>{t('premiumExpiryDate')}</Text>
                                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{expiryDate}</Text>
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
    input: { height: 36, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14, fontWeight: '600', marginTop: 2 },
    nameText: { fontSize: 15, fontWeight: '800' },
    staticValueText: { fontSize: 14, fontWeight: '600' },
    miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    actionBtn: { height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
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