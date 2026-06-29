import React, { useState } from 'react';
import { 
  StyleSheet, Text, TouchableOpacity, View, Modal, 
  TextInput, KeyboardAvoidingView, Platform, Pressable, Alert 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/context/theme-context';
import { useAppUser } from '@/context/user-context';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LoginModal({ visible, onClose }: LoginModalProps) {
  const { t } = useTranslation();
  const { theme, colors } = useAppTheme();
  const { login } = useAppUser();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const validatePassword = (): boolean => {
    if (passwordInput.length < 8) {
      Alert.alert(t('errorTitle'), t('passwordTooShort'));
      return false;
    }
    const hasUpperCase = /[A-Z]/.test(passwordInput);
    const hasLowerCase = /[a-z]/.test(passwordInput);
    if (!hasUpperCase || !hasLowerCase) {
      Alert.alert(t('errorTitle'), t('passwordNeedCase'));
      return false;
    }
    const hasNumber = /[0-9]/.test(passwordInput);
    if (!hasNumber) {
      Alert.alert(t('errorTitle'), t('passwordNeedNumber'));
      return false;
    }
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordInput);
    if (!hasSpecialChar) {
      Alert.alert(t('errorTitle'), t('passwordNeedSpecial'));
      return false;
    }
    if (passwordInput !== confirmPasswordInput) {
      Alert.alert(t('errorTitle'), t('passwordMismatch'));
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async () => {
    if (!emailInput.includes('@')) {
      Alert.alert(t('errorTitle'), t('invalidEmail'));
      return;
    }

    if (isRegisterMode && !validatePassword()) {
      return; 
    }

    // 🌟 降级处理：如果没有配置 Supabase，直接执行原逻辑
    if (!supabase) {
      login();
      setEmailInput('');
      setPasswordInput('');
      setConfirmPasswordInput('');
      setIsRegisterMode(false);
      onClose();
      return;
    }

    try {
      if (isRegisterMode) {
        const { error } = await supabase.auth.signUp({ email: emailInput, password: passwordInput });
        if (error) throw error;
        Alert.alert("注册成功", "请查看您的邮箱完成验证。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
        if (error) throw error;
        
        // 登录成功后，清空状态并关闭模态框
        login();
        setEmailInput('');
        setPasswordInput('');
        setConfirmPasswordInput('');
        setIsRegisterMode(false);
        onClose();
      }
    } catch (err: any) {
      Alert.alert("提示", err.message);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    if (!supabase) {
      login();
      onClose();
      return;
    }
    try {
      const redirectUrl = makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
         await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
         onClose();
      }
    } catch (err: any) {
      Alert.alert("OAuth 失败", err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKAV}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {isRegisterMode ? t('registerModalTitle') : t('loginModalTitle')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {isRegisterMode ? t('registerSubtitle') : t('loginSubtitle')}
            </Text>

            <View style={{ gap: 4, marginTop: 2 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('emailLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder={t('emailPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={emailInput}
                onChangeText={setEmailInput}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={{ gap: 4, marginTop: 4 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('passwordLabel')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder={t('passwordPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={passwordInput}
                onChangeText={setPasswordInput}
                secureTextEntry
              />
              {isRegisterMode && (
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                  💡 {t('passwordRequirementHint')}
                </Text>
              )}
            </View>

            {isRegisterMode && (
              <View style={{ gap: 4, marginTop: 4 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('confirmPasswordLabel')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder={t('confirmPasswordPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPasswordInput}
                  onChangeText={setConfirmPasswordInput}
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.textPrimary }]} onPress={handleLoginSubmit}>
              <Text style={[styles.submitBtnText, { color: theme === 'dark' ? '#0A0A0C' : '#FFFFFF' }]}>
                {isRegisterMode ? t('confirmRegisterBtn') : t('confirmLoginBtn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ alignItems: 'center', marginTop: 4, paddingVertical: 4 }} 
              onPress={() => {
                setIsRegisterMode(!isRegisterMode);
                setConfirmPasswordInput('');
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700' }}>
                {isRegisterMode ? t('switchToLogin') : t('switchToRegister')}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t('oauthDivider')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <View style={{ gap: 10, marginTop: 2 }}>
              <TouchableOpacity style={[styles.oauthBtn, styles.googleLightStyle]} onPress={() => handleOAuthLogin('google')}>
                <View style={styles.oauthInner}>
                  <Svg width="18" height="18" viewBox="0 0 24 24">
                    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </Svg>
                  <Text style={[styles.oauthBtnText, { color: '#1C1C1E', marginLeft: 10 }]}>{t('googleLogin')}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.oauthBtn, 
                  theme === 'dark' 
                    ? { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } 
                    : { backgroundColor: '#FFFFFF', borderColor: '#E5E5EA' } 
                ]} 
                onPress={() => handleOAuthLogin('apple')}
              >
                <View style={styles.oauthInner}>
                  <Text style={[styles.appleNativeGlyph, { color: theme === 'dark' ? '#000000' : '#1C1C1E' }]}></Text>
                  <Text style={[styles.oauthBtnText, { color: theme === 'dark' ? '#000000' : '#1C1C1E', marginLeft: 6 }]}>
                    {t('appleLogin')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalKAV: { width: '100%' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, padding: 24, paddingBottom: 40, gap: 10 },
  closeBtn: { alignSelf: 'flex-end', padding: 4, marginBottom: 2 },
  modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 0.3 },
  modalSubtitle: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700' },
  input: { height: 46, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontWeight: '500' },
  helperText: { fontSize: 10, fontWeight: '500', marginTop: 1, paddingHorizontal: 2, letterSpacing: -0.1 },
  submitBtn: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  submitBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: '600' },
  oauthBtn: { height: 46, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  oauthInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
  oauthBtnText: { fontSize: 13, fontWeight: '700' },
  googleLightStyle: { backgroundColor: '#FFFFFF', borderColor: '#E5E5EA' },
  appleNativeGlyph: { fontSize: 20, fontWeight: '500', lineHeight: 22, transform: [{ translateY: Platform.OS === 'ios' ? -1 : -2 }] }
});