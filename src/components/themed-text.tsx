import { Platform, StyleSheet, Text, type TextProps } from 'react-native';
import { useAppTheme } from '@/context/theme-context'; // 🔒 引入我们全新的全局换肤 Hook

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  // 这里的 themeColor 允许传入 'textPrimary' 或 'textSecondary'，如果不传默认用 textPrimary
  themeColor?: 'textPrimary' | 'textSecondary';
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const { colors } = useAppTheme(); // 💡 动态实时获取当前是黑金还是白金的颜色

  return (
    <Text
      style={[
        // 1. 动态绑定多主题文字颜色，未指定时默认采用当前主题的主文字色
        { color: themeColor ? colors[themeColor] : colors.textPrimary },
        
        // 2. 根据类型注入排版样式
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  title: {
    fontSize: 48,
    fontWeight: '600',
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontWeight: '600',
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    color: '#3c87f7', // 保持原有的链接高亮蓝
  },
  code: {
    // 🌐 跨平台双端安全等宽字体链：iOS 采用 Courier，Android 自动回退到默认的 monospace
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});