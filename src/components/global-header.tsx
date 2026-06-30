import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// 👉 新增 Modal, TouchableWithoutFeedback
import React, { StyleSheet, Text, TouchableOpacity, View, Animated, Alert, TextInput, Modal, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, MaterialIcons } from '@expo/vector-icons'; 
// 👉 新增 Expo Notifications
import * as Notifications from 'expo-notifications';

import { LoginModal } from '@/components/login-modal';

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'EN' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
];

export default function GlobalHeader() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, colors } = useAppTheme();
  // 👉 额外解构出 session 和 logout
  const { isPremium, isLoggedIn, session, logout } = useAppUser();
  const router = useRouter();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  // 👉 新增：控制头像下拉菜单的状态
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];
  const toggleAnim = useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery(''); 
    }
  };

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: theme === 'dark' ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [theme]);

  const translateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 28],
  });

  // 👉 修改：已登录时不再直接跳转，而是打开下拉菜单
  const handleAvatarPress = () => {
    if (isLoggedIn) {
      setAvatarMenuVisible(true);
    } else {
      setLoginModalVisible(true);
    }
  };

  // 👉 新增：安全退出登录逻辑
  const handleLogout = async () => {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
      });
      const pushToken = tokenData.data;
      const accessToken = session?.access_token;
      
      if (pushToken && accessToken) {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL;
        await fetch(`${baseUrl}/api/v1/user/device/${pushToken}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
      }
    } catch (e) {
      console.warn('注销推送设备失败:', e);
    } finally {
      logout();
    }
  };

  const handleFavoritesPress = () => {
      if (!isLoggedIn) {
          setLoginModalVisible(true);
      } else if (!isPremium) {
          Alert.alert(t('errorTitle'), t('memberExclusive'));
      } else {
          router.push('/favorites');
      }
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setDropdownOpen(false);
  };

  return (
    <View 
      style={[
        styles.headerContainer, 
        { 
          backgroundColor: colors.background, 
          borderColor: colors.border,
          paddingTop: Math.max(insets.top, 12),
        }
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftRow}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={[styles.toggleContainer, { backgroundColor: theme === 'dark' ? '#141417' : '#E5E5EA', borderColor: colors.border }]} 
            onPress={toggleTheme}
          >
            <View style={styles.toggleIconContainer}>
              <Text style={styles.toggleInsideIcon}>☀️</Text>
              <Text style={styles.toggleInsideIcon}>🌙</Text>
            </View>
            <Animated.View 
              style={[
                styles.toggleSlider, 
                { 
                  transform: [{ translateX }],
                  backgroundColor: theme === 'dark' ? '#F4D068' : '#1C1C1E',
                  shadowColor: theme === 'dark' ? '#F4D068' : '#000'
                }
              ]} 
            />
          </TouchableOpacity>

          <View style={styles.langWrapper}>
            <TouchableOpacity style={[styles.langBtn, { borderColor: colors.border }]} onPress={() => setDropdownOpen(!dropdownOpen)}>
              <Text style={[styles.langText, { color: colors.textPrimary }]}>{currentLang.name} ▾</Text>
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {languages.map((lang) => (
                  <TouchableOpacity key={lang.code} style={styles.dropdownItem} onPress={() => changeLanguage(lang.code)}>
                    <Text style={[styles.dropdownName, { color: colors.textPrimary }]}>{lang.name}</Text>
                    {i18n.language === lang.code && <Text style={[styles.checkmark, { color: colors.textPrimary }]}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <TouchableOpacity 
              style={[styles.avatarBtn, { borderColor: colors.border, backgroundColor: colors.card }]} 
              onPress={handleFavoritesPress}
              activeOpacity={0.7}
            >
               <MaterialIcons name="show-chart" size={18} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.avatarBtn, { borderColor: colors.border, backgroundColor: colors.card }]} 
              onPress={handleAvatarPress}
              activeOpacity={0.7}
            >
              {isLoggedIn ? (
                <>
                  <AntDesign name="user" size={20} color={colors.textPrimary} />
                  {isPremium && (
                    <View style={[styles.crownBadge, { backgroundColor: theme === 'dark' ? '#2A261F' : '#FFFDF0', borderColor: '#D4A373' }]}>
                      <Text style={styles.crownIconText}>👑</Text>
                    </View>
                  )}
                </>
              ) : (
                <AntDesign name="user" size={20} color={colors.textSecondary} style={{ opacity: 0.5 }} />
              )}
            </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ fontSize: 16, marginRight: 8, opacity: 0.6 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      <LoginModal 
        visible={loginModalVisible} 
        onClose={() => setLoginModalVisible(false)} 
      />

      {/* 👉 新增：头像专用下拉菜单 */}
      <Modal visible={avatarMenuVisible} transparent={true} animationType="fade">
        <TouchableWithoutFeedback onPress={() => setAvatarMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.avatarDropdownMenu,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  top: Math.max(insets.top, 12) + 48, // 动态适配安全区，悬浮在头像正下方
                }
              ]}>
                
                <TouchableOpacity
                  style={[styles.avatarDropdownItem, { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  onPress={() => {
                    setAvatarMenuVisible(false);
                    router.push('/profile');
                  }}
                >
                  <Text style={[styles.avatarDropdownText, { color: colors.textPrimary }]}>👤 {t('profile')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.avatarDropdownItem}
                  onPress={async () => {
                    setAvatarMenuVisible(false);
                    await handleLogout();
                  }}
                >
                  <Text style={[styles.avatarDropdownText, { color: '#FF453A' }]}>🚪 {t('logout')}</Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, zIndex: 999 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 40 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  toggleContainer: { width: 58, height: 32, borderRadius: 16, borderWidth: 1, position: 'relative', justifyContent: 'center', paddingHorizontal: 4 },
  toggleIconContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  toggleInsideIcon: { fontSize: 11 },
  toggleSlider: { width: 24, height: 24, borderRadius: 12, position: 'absolute', top: 3, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.5, elevation: 2 },
  langWrapper: { zIndex: 1000 },
  langBtn: { height: 32, paddingHorizontal: 10, borderRadius: 16, borderWidth: 1, justifyContent: 'center' },
  langText: { fontSize: 11, fontWeight: '700' },
  dropdown: { position: 'absolute', top: 36, left: 0, width: 90, borderRadius: 8, borderWidth: 1, padding: 4, gap: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 6, borderRadius: 4 },
  dropdownName: { fontSize: 11, flex: 1, fontWeight: '600' },
  checkmark: { fontSize: 10, fontWeight: '900' },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  crownBadge: { position: 'absolute', bottom: -3, right: -3, width: 15, height: 15, borderRadius: 7.5, borderWidth: 1, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 2 },
  crownIconText: { fontSize: 8, textAlign: 'center', lineHeight: 10 },
  
  // 👉 新增：头像下拉菜单专属样式
  modalOverlay: { flex: 1 },
  avatarDropdownMenu: {
    position: 'absolute',
    right: 16,
    width: 140,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  avatarDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarDropdownText: {
    fontSize: 15,
    fontWeight: '600',
  }
});