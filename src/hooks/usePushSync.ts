import { useState, useEffect } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useAppUser } from '@/context/user-context';
import { useTranslation } from 'react-i18next';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    // 兼容老版本
    shouldShowBanner: true,   // 🌟 新增：允许在屏幕顶部弹出横幅
    shouldShowList: true,     // 🌟 新增：允许在通知中心列表中显示
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushSync() {
  // 🌟 修复 1：解构出 session 而不是不存在的 token
  const { isLoggedIn, isPremium, session } = useAppUser(); 
  const { i18n } = useTranslation();
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (!Device.isDevice) {
        console.log('必须使用物理设备才能接收推送');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('未获得推送权限');
        return;
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        setPushToken(tokenData.data);
      } catch (e) {
        console.error("获取推送Token失败:", e);
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    }

    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    const syncDeviceWithBackend = async () => {
      // 🌟 修复 2：从 session 中提取真实的 access_token
      const accessToken = session?.access_token;
      
      if (!pushToken || !isLoggedIn || !accessToken) return;

      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!baseUrl) return;

      try {
        await fetch(`${baseUrl}/api/v1/user/device`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 🌟 修复 3：使用正确的 accessToken 放入请求头
            'Authorization': `Bearer ${accessToken}` 
          },
          body: JSON.stringify({
            push_token: pushToken,
            language: i18n.language,
            is_premium: isPremium 
          })
        });
      } catch (error) {
        console.error('同步设备信息失败:', error);
      }
    };

    syncDeviceWithBackend();
  }, [pushToken, isLoggedIn, isPremium, i18n.language, session?.access_token]); // 🌟 修复 4：依赖项更新
}