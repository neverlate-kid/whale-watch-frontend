import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet, Text, TouchableOpacity, View,
  Modal, TextInput, KeyboardAvoidingView, Platform, Pressable
} from 'react-native';

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'EN' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
];

export default function GlobalHeader() {
  const { i18n } = useTranslation();
  const { theme, toggleTheme, colors } = useAppTheme();
  const { isPremium, isLoggedIn, login } = useAppUser();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const handleAvatarPress = () => {
    if (isLoggedIn) {
      router.push('/profile');
    } else {
      setLoginModalVisible(true);
    }
  };

  const handleLogin = () => {
    // Mock login — in production, call your auth API
    login();
    setLoginModalVisible(false);
    setEmailInput('');
    setPasswordInput('');
  };

  const loginLabels: Record<string, Record<string, string>> = {
    zh: {
      title: isRegisterMode ? '创建账户' : '登录账户',
      subtitle: isRegisterMode ? '加入大庄家追踪，解锁完整雷达数据' : '欢迎回来，继续追踪大庄动向',
      emailPlaceholder: '邮箱地址',
      passwordPlaceholder: '密码',
      submit: isRegisterMode ? '注册' : '登录',
      toggle: isRegisterMode ? '已有账号？登录' : '没有账号？注册',
      or: '或使用第三方登录',
      apple: '  Apple 账号登录',
      google: '  Google 账号登录',
      close: '✕',
    },
    en: {
      title: isRegisterMode ? 'Create Account' : 'Sign In',
      subtitle: isRegisterMode ? 'Join Whale Watch and unlock the full radar' : 'Welcome back — keep tracking the whales',
      emailPlaceholder: 'Email address',
      passwordPlaceholder: 'Password',
      submit: isRegisterMode ? 'Register' : 'Sign In',
      toggle: isRegisterMode ? 'Already have an account? Sign in' : "Don't have an account? Register",
      or: 'Or continue with',
      apple: '  Sign in with Apple',
      google: '  Sign in with Google',
      close: '✕',
    },
    ja: {
      title: isRegisterMode ? 'アカウント作成' : 'ログイン',
      subtitle: isRegisterMode ? '登録してレーダー全機能を解放' : 'おかえりなさい',
      emailPlaceholder: 'メールアドレス',
      passwordPlaceholder: 'パスワード',
      submit: isRegisterMode ? '登録する' : 'ログイン',
      toggle: isRegisterMode ? 'すでにアカウントをお持ちの方' : 'アカウントをお持ちでない方',
      or: 'または',
      apple: '  Apple でサインイン',
      google: '  Google でサインイン',
      close: '✕',
    },
    ko: {
      title: isRegisterMode ? '계정 만들기' : '로그인',
      subtitle: isRegisterMode ? '가입하고 전체 레이더를 잠금 해제' : '돌아오신 걸 환영합니다',
      emailPlaceholder: '이메일 주소',
      passwordPlaceholder: '비밀번호',
      submit: isRegisterMode ? '가입하기' : '로그인',
      toggle: isRegisterMode ? '이미 계정이 있으신가요?' : '계정이 없으신가요? 가입하기',
      or: '또는',
      apple: '  Apple로 로그인',
      google: '  Google로 로그인',
      close: '✕',
    },
  };

  const lang = loginLabels[i18n.language] || loginLabels['en'];

  return (
    <>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>

        {/* 左：头像 / 登录入口 */}
        <TouchableOpacity
          style={[
            styles.avatarBtn,
            {
              borderColor: isPremium ? '#FFD700' : isLoggedIn ? colors.border : colors.textSecondary,
              backgroundColor: colors.card,
            }
          ]}
          onPress={handleAvatarPress}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarIcon}>{isPremium ? '👑' : isLoggedIn ? '👤' : '🔓'}</Text>
        </TouchableOpacity>

        {/* 右侧控件组 */}
        <View style={styles.rightGroup}>

          {/* 主题切换 Toggle */}
          <TouchableOpacity
            style={[styles.toggleTrack, { backgroundColor: theme === 'dark' ? '#1A1A2E' : '#E8EEFF' }]}
            onPress={toggleTheme}
            activeOpacity={0.85}
          >
            <View style={[
              styles.toggleKnob,
              {
                backgroundColor: theme === 'dark' ? '#3D3D6B' : '#FFFFFF',
                left: theme === 'dark' ? 3 : 37,
                shadowColor: '#000',
              }
            ]} />
            {theme === 'dark'
              ? <Text style={[styles.toggleIcon, { left: 8 }]}>🌙</Text>
              : <Text style={[styles.toggleIcon, { right: 8 }]}>☀️</Text>
            }
          </TouchableOpacity>

          {/* 语言下拉 */}
          <View style={styles.langWrapper}>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: colors.card, borderColor: dropdownOpen ? colors.textPrimary : colors.border }]}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={[styles.langLabel, { color: colors.textPrimary }]} numberOfLines={1}>{currentLang.name}</Text>
              <Text style={[styles.langChevron, { color: colors.textSecondary, transform: [{ rotate: dropdownOpen ? '180deg' : '0deg' }] }]}>▾</Text>
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {languages.map((lang, idx) => {
                  const isActive = i18n.language === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.dropdownItem,
                        isActive && { backgroundColor: colors.textPrimary + '18' },
                        idx < languages.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                      ]}
                      onPress={() => { i18n.changeLanguage(lang.code); setDropdownOpen(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownName, { color: isActive ? colors.textPrimary : colors.textSecondary, fontWeight: isActive ? '800' : '500' }]}>
                        {lang.name}
                      </Text>
                      {isActive && <Text style={[styles.checkmark, { color: colors.textPrimary }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

        </View>
      </View>

      {/* 🔐 登录模态框 */}
      <Modal
        visible={loginModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLoginModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKAV}
          >
            <Pressable onPress={() => {}} style={[styles.modalSheet, { backgroundColor: theme === 'dark' ? '#141417' : '#FFFFFF', borderColor: theme === 'dark' ? '#2C2C30' : '#E5E5EA' }]}>

              {/* 关闭按钮 */}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setLoginModalVisible(false)}>
                <Text style={{ color: theme === 'dark' ? '#AEAEB2' : '#636366', fontSize: 14, fontWeight: '700' }}>{lang.close}</Text>
              </TouchableOpacity>

              {/* 标题 */}
              <Text style={[styles.modalTitle, { color: theme === 'dark' ? '#F4D068' : '#1C1C1E' }]}>{lang.title}</Text>
              <Text style={[styles.modalSubtitle, { color: theme === 'dark' ? '#AEAEB2' : '#636366' }]}>{lang.subtitle}</Text>

              {/* 邮箱 / 密码输入 */}
              <TextInput
                style={[styles.input, { backgroundColor: theme === 'dark' ? '#0A0A0C' : '#F9F9FB', borderColor: theme === 'dark' ? '#2C2C30' : '#E5E5EA', color: theme === 'dark' ? '#F4D068' : '#1C1C1E' }]}
                placeholder={lang.emailPlaceholder}
                placeholderTextColor={theme === 'dark' ? '#555560' : '#AEAEB2'}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme === 'dark' ? '#0A0A0C' : '#F9F9FB', borderColor: theme === 'dark' ? '#2C2C30' : '#E5E5EA', color: theme === 'dark' ? '#F4D068' : '#1C1C1E' }]}
                placeholder={lang.passwordPlaceholder}
                placeholderTextColor={theme === 'dark' ? '#555560' : '#AEAEB2'}
                value={passwordInput}
                onChangeText={setPasswordInput}
                secureTextEntry
              />

              {/* 主要提交按钮 */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme === 'dark' ? '#F4D068' : '#1C1C1E' }]}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={[styles.submitBtnText, { color: theme === 'dark' ? '#0A0A0C' : '#FFFFFF' }]}>{lang.submit}</Text>
              </TouchableOpacity>

              {/* 切换注册/登录 */}
              <TouchableOpacity onPress={() => setIsRegisterMode(!isRegisterMode)} style={styles.toggleMode}>
                <Text style={{ color: theme === 'dark' ? '#AEAEB2' : '#636366', fontSize: 12 }}>{lang.toggle}</Text>
              </TouchableOpacity>

              {/* 分割线 */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme === 'dark' ? '#2C2C30' : '#E5E5EA' }]} />
                <Text style={[styles.dividerText, { color: theme === 'dark' ? '#555560' : '#AEAEB2' }]}>{lang.or}</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme === 'dark' ? '#2C2C30' : '#E5E5EA' }]} />
              </View>

              {/* Apple 登录 */}
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: theme === 'dark' ? '#000000' : '#000000', borderColor: '#333' }]}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                {/* Apple logo SVG as text approximation */}
                <Text style={styles.socialIcon}>🍎</Text>
                <Text style={[styles.socialBtnText, { color: '#FFFFFF' }]}>{lang.apple}</Text>
              </TouchableOpacity>

              {/* Google 登录 */}
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: theme === 'dark' ? '#1A1A1A' : '#FFFFFF', borderColor: theme === 'dark' ? '#2C2C30' : '#E5E5EA' }]}
                onPress={handleLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.socialIcon}>🔵</Text>
                <Text style={[styles.socialBtnText, { color: theme === 'dark' ? '#FFFFFF' : '#1C1C1E' }]}>{lang.google}</Text>
              </TouchableOpacity>

            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 999,
  },

  // 头像
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: { fontSize: 17 },

  // 右侧
  rightGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  // Toggle
  toggleTrack: { width: 68, height: 30, borderRadius: 15, justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  toggleKnob: { width: 28, height: 24, borderRadius: 12, position: 'absolute', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, zIndex: 1 },
  toggleIcon: { fontSize: 13, position: 'absolute', zIndex: 2 },

  // 语言
  langWrapper: { position: 'relative', zIndex: 1000 },
  langBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, width: 68 },
  langLabel: { fontSize: 12, fontWeight: '700', flex: 1 },
  langChevron: { fontSize: 10, fontWeight: '700', flexShrink: 0 },
  dropdown: { position: 'absolute', top: 40, right: 0, minWidth: 130, borderRadius: 12, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 8 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 8 },
  dropdownName: { fontSize: 13, flex: 1 },
  checkmark: { fontSize: 12, fontWeight: '900' },

  // 登录模态框
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalKAV: { width: '100%' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 4 },
  modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 0.3 },
  modalSubtitle: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  toggleMode: { alignItems: 'center', paddingVertical: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: '600' },
  socialBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: { fontSize: 16, position: 'absolute', left: 16 },
  socialBtnText: { fontSize: 13, fontWeight: '700' },
});