import { Slot, useRouter } from 'expo-router'; // 🌟 新增 useRouter
import { ThemeProvider } from '@/context/theme-context';
import { UserProvider } from '@/context/user-context';
import GlobalHeader from '@/components/global-header';
import { View } from 'react-native';

// 🌟 引入推送和通知库
import { usePushSync } from '@/hooks/usePushSync';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export default function RootLayout() {
  const router = useRouter();

  // 🌟 1. 激活后台引擎：挂载上报 Token 和语言环境的 Hook
  usePushSync();

  // 🌟 2. 监听点击事件：当用户点击系统推送横幅时，直接跳往目标页面
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      // 读取后端塞在 payload data 里的 url (例如: "/radar" 或 "/favorites")
      const url = response.notification.request.content.data?.url;
      if (url) {
        router.push(url as any); 
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <UserProvider>
      <ThemeProvider>
        <View style={{ flex: 1 }}>
          <GlobalHeader /> 
          <Slot />         
        </View>
      </ThemeProvider>
    </UserProvider>
  );
}