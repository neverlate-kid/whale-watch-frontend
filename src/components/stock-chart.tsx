import { NIKKEI_225_DICT } from '@/constants/nikkei-dict';
import { formatStockTime } from '@/utils/i18n';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

interface ChartProps {
  ticker: string;
  data: { date: string; close: number; volume: number }[];
  color: string;
  textColor: string;
  borderColor: string;
  timeZoneMode: 'JST' | 'local';
  onTimeZoneChange: (mode: 'JST' | 'local') => void;
  // 🌟 新增：客户端实时刷新相关的 Props
  onRefresh?: () => void;
  isRefreshing?: boolean;
  marketStatus?: 'open' | 'closed'; 
}

export function StockChart({ 
  ticker, data, color, textColor, borderColor, 
  timeZoneMode, onTimeZoneChange,
  onRefresh, isRefreshing = false, marketStatus = 'closed' 
}: ChartProps) {
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

  // 🌟 核心时间解析逻辑：自动区分纯日期与带时间的实时数据
  const getLocalizedDate = (rawDate: string) => {
    // 假设纯日期格式为 "YYYY-MM-DD" (长度 10)
    // 如果没有时间尾缀，或者当前已经收盘，我们只显示日期，不显示具体几点
    if (rawDate.length <= 10 || marketStatus === 'closed') {
      return rawDate.split(' ')[0]; // 确保只返回 YYYY-MM-DD
    }
    // 如果是盘中实时拼接的数据，包含时间（如 "2026-06-26 14:30:00"），则走时区转换引擎
    return formatStockTime(rawDate, timeZoneMode);
  };

  const getToggleLabel = () => {
    if (timeZoneMode === 'JST') {
      if (i18n.language === 'zh') return '东京'; 
      if (i18n.language === 'ja') return '日本'; 
      if (i18n.language === 'ko') return '도쿄'; 
      return 'J';
    } else {
      if (i18n.language === 'zh') return '本地'; 
      if (i18n.language === 'ja') return '現地'; 
      if (i18n.language === 'ko') return '로컬'; 
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
  
  // 判断当前选中的点是否有时间信息（即是否是今天拼接的实时点）
  const hasTimeInfo = displayPoint.date.length > 10 && marketStatus === 'open';

  return (
    <View style={styles.container}>
      {/* 顶部面板 */}
      <View style={[styles.interactiveHeader, { borderColor }]}>
        <View>
          <Text style={{ color: textColor, fontSize: 13, fontWeight: '900', marginBottom: 2 }}>
            {ticker}
          </Text>
          <Text style={[styles.statusText, { color: textColor }]}>
            ● {activePoint ? t('statusLocked') : t('latest')}
          </Text>
          <Text style={[styles.volumeText, { color: textColor }]}>
            {t('volume')}: {displayPoint.volume.toLocaleString()}
          </Text>
        </View>

        {/* 🌟 价格与刷新控制区 */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.livePrice, { color }]}>
            ¥{displayPoint.close.toLocaleString()}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.refreshCapsule, 
              { 
                backgroundColor: marketStatus === 'closed' ? borderColor + '20' : color + '15',
                borderColor: marketStatus === 'closed' ? borderColor + '50' : color + '60'
              }
            ]}
            disabled={marketStatus === 'closed' || isRefreshing}
            onPress={onRefresh}
            activeOpacity={0.7}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={color} style={{ transform: [{ scale: 0.6 }] }} />
            ) : (
              <Text style={[styles.refreshText, { color: marketStatus === 'closed' ? textColor : color }]}>
                {marketStatus === 'closed' ? `🌙 ${t('marketClosed')}` : `🔄 ${t('refreshPrice')}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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

      {/* 🕒 时区底座：如果不是盘中带有时间的实时点，就隐藏右侧的时区切换器，保持UI干净 */}
      <View style={[styles.liveTimeFooter, { backgroundColor: borderColor + '15', borderColor }]}>
        <Text style={[styles.liveTimeText, { color: textColor }]} numberOfLines={1}>
          ⏱️ {activePoint ? t('lockedTime') : t('patchTime')}: {getLocalizedDate(displayPoint.date)}
        </Text>

        {hasTimeInfo && (
          <TouchableOpacity
            style={[styles.miniZoneButton, { borderColor: textColor }]}
            onPress={() => onTimeZoneChange(timeZoneMode === 'JST' ? 'local' : 'JST')}
            activeOpacity={0.7}
          >
            <Text style={[styles.miniZoneText, { color: textColor }]}>{getToggleLabel()}</Text>
          </TouchableOpacity>
        )}
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
  
  // 🌟 新增：刷新胶囊按钮样式
  refreshCapsule: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, marginTop: 4, minWidth: 60, minHeight: 22 },
  refreshText: { fontSize: 10, fontWeight: '800' },

  chartRow: { flexDirection: 'row' },
  yAxis: { flex: 1, justifyContent: 'space-between', paddingLeft: 8, borderLeftWidth: 1 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 4, marginTop: 2 },
  tickLabelWrapper: { flex: 1 },
  timeLabelWrapper: { flex: 1 },
  tickText: { fontSize: 9, fontFamily: 'monospace', fontWeight: '600' },
  liveTimeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingLeft: 10, paddingRight: 6, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  liveTimeText: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace', flex: 1, marginRight: 8 },
  miniZoneButton: { width: 36, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  miniZoneText: { fontSize: 9, fontWeight: '900' }
});