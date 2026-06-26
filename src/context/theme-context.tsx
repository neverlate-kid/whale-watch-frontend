import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceScheme } from 'react-native';
import { themeColors, ThemeType } from '../constants/theme';

type ThemeContextType = {
  theme: ThemeType;
  colors: typeof themeColors.dark;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useDeviceScheme(); // 获取手机系统自带的暗黑/明亮设置
  const [theme, setTheme] = useState<ThemeType>('dark'); // 默认黑金

  // 🔄 切换主题的函数
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 💡 当前生效的颜色矩阵
  const colors = themeColors[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 🎣 自定义 Hook，方便子组件一键调用
export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within a ThemeProvider');
  return context;
}