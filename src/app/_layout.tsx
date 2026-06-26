import { Slot } from 'expo-router';
import { ThemeProvider } from '@/context/theme-context';
import { UserProvider } from '@/context/user-context';
import GlobalHeader from '@/components/global-header';
import { View } from 'react-native';

export default function RootLayout() {
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