// 🎨 黑金与明亮两套硬核主题的色彩矩阵
export const themeColors = {
  dark: {
    background: '#0A0A0C',      // 极邃黑
    card: '#141417',            // 石墨黑
    border: '#2C2C30',          // 哑光暗灰边框
    textPrimary: '#F4D068',     // 皇家钛金（核心文字/强调）
    textSecondary: '#AEAEB2',   // 暗灰次要文字
    buttonBg: 'transparent',
    buttonBorder: '#F4D068',
    buttonText: '#F4D068',
    statusBarStyle: 'light-content' as const,
  },
  light: {
    background: '#F9F9FB',     // 纯净雪白
    card: '#FFFFFF',           // 珍珠白卡片
    border: '#E5E5EA',         // 明亮浅灰边框
    textPrimary: '#1C1C1E',    // 曜石深黑（核心文字）
    textSecondary: '#636366',  // 深灰次要文字
    buttonBg: '#1C1C1E',       // 深色实心按钮
    buttonBorder: '#1C1C1E',
    buttonText: '#FFFFFF',     // 按钮白字
    statusBarStyle: 'dark-content' as const,
  },
};

export type ThemeType = 'dark' | 'light';