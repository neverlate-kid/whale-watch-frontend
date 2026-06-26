import React, { useState } from 'react';
import { View, Dimensions, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { formatStockTime } from '@/utils/i18n';

interface ChartProps {
  data: { date: string; close: number; volume: number }[];
  color: string;
  textColor: string;
  borderColor: string;
  timeZoneMode: 'JST' | 'local';
  onTimeZoneChange: (mode: 'JST' | 'local') => void;
}

export function StockChart({ data, color, textColor, borderColor, timeZoneMode, onTimeZoneChange }: ChartProps) {
  const { t, i18n } = useTranslation();
  if (!data || data.length === 0) return null;

  const screenWidth = Dimensions.get('window').width - 80;
  const height = 180;
  const paddingRight = 55;
  const paddingBottom = 20;
  
  const chartWidth = screenWidth - paddingRight;
  const chartHeight = height - paddingBottom;

  const prices = data.map(d => d.close);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice || 1;
  const yTicks = [maxPrice, minPrice + priceRange / 2, minPrice];

  const getLocalizedDate = (rawDate: string) => {
    const fullJstString = rawDate.includes(' ') ? rawDate : `${rawDate} 15:30:00`;
    return formatStockTime(fullJstString, timeZoneMode);
  };

  // 🌐 根据当前语言，动态计算 Toggle 内部应该显示哪个缩写中文字符
  const getToggleLabel = () => {
    if (timeZoneMode === 'JST') {
      if (i18n.language === 'zh') return '东京'; // 东京时间
      if (i18n.language === 'ja') return '日本'; // 日本時間
      if (i18n.language === 'ko') return '도쿄'; // 도쿄
      return 'J';
    } else {
      if (i18n.language === 'zh') return '本地'; // 本地时间
      if (i18n.language === 'ja') return '現地'; // 現地時間
      if (i18n.language === 'ko') return '로컬'; // 로컬
      return 'L';
    }
  };

  const totalPoints = data.length;
  const xTicks = [
    { label: data[0].date.split(' ')[0], align: 'flex-start' as const },
    { label: data[Math.floor(totalPoints / 2)].date.split(' ')[0], align: 'center' as const },
    { label: data[totalPoints - 1].date.split(' ')[0], align: 'flex-end' as const }
  ];

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.close - minPrice) / priceRange) * (chartHeight - 25) - 10;
    return { x, y, ...item };
  });

  const [activePoint, setActivePoint] = useState<typeof points[0] | null>(null);

  let pathStr = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathStr += ` L ${points[i].x} ${points[i].y}`;
  }
  const closedPathStr = `${pathStr} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  const handleTouch = (evt: any) => {
    const touchX = evt.nativeEvent.locationX;
    const closestIndex = Math.max(0, Math.min(points.length - 1, Math.round((touchX / chartWidth) * (points.length - 1))));
    setActivePoint(points[closestIndex]);
  };

  const displayPoint = activePoint || points[points.length - 1];

  return (
    <View style={styles.container}>
      {/* 顶部面板 */}
      <View style={[styles.interactiveHeader, { borderColor }]}>
        <View>
          <Text style={[styles.statusText, { color: activePoint ? color : textColor }]}>
            ● {activePoint ? 'LOCKED' : t('latest')}
          </Text>
          <Text style={[styles.volumeText, { color: textColor }]}>
            {t('volume')}: {displayPoint.volume.toLocaleString()}
          </Text>
        </View>
        <Text style={[styles.livePrice, { color }]}>
          ¥{displayPoint.close.toLocaleString()}
        </Text>
      </View>

      {/* 图表主图 */}
      <View style={styles.chartRow}>
        <View style={{ height, width: chartWidth }}>
          <View
            style={{ height: chartHeight, width: chartWidth }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouch}
            onResponderMove={handleTouch}
            onResponderRelease={() => setActivePoint(null)}
          >
            <Svg height={chartHeight} width={chartWidth}>
              <Defs>
                <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={color} stopOpacity="0.25" />
                  <Stop offset="100%" stopColor={color} stopOpacity="0.00" />
                </LinearGradient>
              </Defs>
              <Path d={closedPathStr} fill="url(#chartGradient)" />
              <Path d={pathStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {activePoint && (
                <>
                  <Line x1={activePoint.x} y1={0} x2={activePoint.x} y2={chartHeight} stroke={textColor} strokeWidth="1" strokeDasharray="4,4" opacity={0.5} />
                  <Circle cx={activePoint.x} cy={activePoint.y} r="6" fill={color} stroke={textColor} strokeWidth="2" />
                </>
              )}
            </Svg>
          </View>
          
          <View style={[styles.xAxis, { borderColor }]}>
            {xTicks.map((tick, idx) => (
              <View key={idx} style={[styles.timeLabelWrapper, { alignItems: tick.align }]}>
                <Text style={[styles.tickText, { color: textColor }]}>{tick.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.yAxis, { height: chartHeight, borderColor }]}>
          {yTicks.map((tick, idx) => {
            let justifyStyle: 'flex-start' | 'center' | 'flex-end' = 'center';
            if (idx === 0) justifyStyle = 'flex-start';
            if (idx === 2) justifyStyle = 'flex-end';
            return (
              <View key={idx} style={[styles.tickLabelWrapper, { justifyContent: justifyStyle }]}>
                <Text style={[styles.tickText, { color: textColor }]}>¥{Math.round(tick).toLocaleString()}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 🕒 升级版：呼吸感超紧凑时区底座 */}
      <View style={[styles.liveTimeFooter, { backgroundColor: borderColor + '15', borderColor }]}>
        <Text style={[styles.liveTimeText, { color: textColor }]} numberOfLines={1}>
          ⏱️ {activePoint ? t('lockedTime') : t('patchTime')}: {getLocalizedDate(displayPoint.date)}
        </Text>
        
        {/* 🔘 彻底美化后的极简拟物化圆形小纽扣 */}
        <TouchableOpacity 
          style={[styles.miniZoneButton, { backgroundColor: color }]} 
          onPress={() => onTimeZoneChange(timeZoneMode === 'JST' ? 'local' : 'JST')}
          activeOpacity={0.7}
        >
          <Text style={styles.miniZoneText}>{getToggleLabel()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  interactiveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottomWidth: 1, borderStyle: 'dashed' },
  statusText: { fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  volumeText: { fontSize: 11, opacity: 0.6, marginTop: 4 },
  livePrice: { fontSize: 24, fontWeight: '900', fontFamily: 'monospace' },
  chartRow: { flexDirection: 'row' },
  yAxis: { flex: 1, justifyContent: 'space-between', paddingLeft: 8, borderLeftWidth: 1 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 4, marginTop: 2 },
  tickLabelWrapper: { flex: 1 },
  timeLabelWrapper: { flex: 1 },
  tickText: { fontSize: 9, fontFamily: 'monospace', fontWeight: '600' },
  
  // 底部底座精修
  liveTimeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingLeft: 10, paddingRight: 6, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  liveTimeText: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace', flex: 1, marginRight: 8 },
  
  // 圆形微粒小开关，拒绝拥挤
  miniZoneButton: { width: 36, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  miniZoneText: { fontSize: 9, fontWeight: '900', color: '#000' }
});