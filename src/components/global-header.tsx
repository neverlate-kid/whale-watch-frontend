import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// 🌟 引入 MaterialIcons 来完美替代出问题的 AntDesign linechart
import { AntDesign, MaterialIcons } from '@expo/vector-icons'; 

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
  const { isPremium, isLoggedIn } = useAppUser();
  const router = useRouter();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];
  const toggleAnim = useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;

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

  const handleAvatarPress = () => {
    if (isLoggedIn) {
      router.push('/profile');
    } else {
      setLoginModalVisible(true);
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
          {/* 🌟 替换为 MaterialIcons 的 show-chart (标准的股票波动折线图) */}
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

      <LoginModal 
        visible={loginModalVisible} 
        onClose={() => setLoginModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, zIndex: 999 },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
});