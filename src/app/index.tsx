import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* 确保手机状态栏文字也是白色的，完美融入纯黑背景 */}
      <StatusBar barStyle="light-content" />

      {/* 顶部 Header 区域 */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>WHALE WATCH</Text>
        <Text style={styles.brandSubtitle}>Deep Sea Intelligence Platform</Text>
      </View>

      {/* 核心仪表盘/卡片区域 */}
      <View style={styles.mainCard}>
        <Text style={styles.cardTitle}>LIVE OMNI-RADAR</Text>
        <View style={styles.radarStatusContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusText}>SCANNING NORTH PACIFIC...</Text>
        </View>
        
        {/* 数据展示 */}
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Active Pods Detected</Text>
          <Text style={styles.dataValue}>03</Text>
        </View>
      </View>

      {/* 底部功能性黑金按钮 */}
      <TouchableOpacity 
        style={styles.primaryButton}
        activeOpacity={0.8}
        onPress={() => console.log('Initiating server handshake...')}
      >
        <Text style={styles.buttonText}>LAUNCH ACCELERATED SCAN</Text>
      </TouchableOpacity>
    </View>
  );
}

// 🐳 纯正黑金美学样式表
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C', // 极邃黑
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 50,
  },
  header: {
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F4D068', // 皇家钛金
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#8E8E93', // 哑光暗灰
    letterSpacing: 1,
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: '#141417', // 石墨黑卡片
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2C2C30', // 微暗边框
    shadowColor: '#F4D068',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, // 极淡的金色环境光漫反射
    shadowRadius: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4D068',
    letterSpacing: 2,
    marginBottom: 16,
  },
  radarStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30D158', // 荧光绿雷达点
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E5E5EA',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#2C2C30',
  },
  dataLabel: {
    fontSize: 14,
    color: '#AEAEB2',
  },
  dataValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F4D068',
  },
  primaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#F4D068', // 金色镂空按钮
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#F4D068',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});