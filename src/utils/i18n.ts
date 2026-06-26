import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import i18n from 'i18next'; // 👈 检查这一行是否长这样！必须是小写的 i18n
import { initReactI18next } from 'react-i18next';

dayjs.extend(utc);
dayjs.extend(timezone);

const resources = {
  zh: {
    translation: {
      brand: "大庄家追踪",
      subtitle: "日股异动全球化警报",
      marketClosed: "收盘 / 离线数据聚合中",
      marketOpen: "盘中动态刷新中",
      volume: "成交量",
      latest: "最新",
      connected: "已连接",
      periodDaily: "1月 / 1年 日K",
      periodWeekly: "10年 周K",
      radarButton: "开启全量日经225异动扫描",
      patchTime: "盘中API补丁时间",
      lockedTime: "成交量对应时点",
      todayWhale: "今日异动最大股票榜 (Top 3)",
      radarTitle: "日经 225 全量异动雷达",
      whaleScore: "异动指数",
      aiAnalysis: "AI 智能综合研判",
      aiOpinion: "AI 独家点评",
      newsTitle: "近期机构异动动向精选",
      stock_9983: "迅销 (9983)",
      stock_9984: "软银集团 (9984)",
      stock_6758: "索尼集团 (6758)",
      stock_7203: "丰田汽车 (7203)",
      reason_whale: "盘中出现超级机构巨型买单（Whale Order），疑似主力量化建仓。",
      reason_ma: "突破 25 日均线关键阻力位，成交量较昨日放大 1.8 倍。",
      reason_dump: "高位获利盘无量砸盘，短线需注意资金回撤风险。",
      reason_normal: "大盘权重正常资金调仓，主力波幅在合理技术区间内。",

      // 🌟 新增会员与账户相关词条
      login: "登录账户",
      logout: "退出登录",
      premiumUser: "尊贵高级会员",
      freeUser: "免费账户",
      upgradeBtn: "充值升级 Premium 会员",
      myFavorites: "我收藏的异动股",
      editProfile: "编辑个人资料",
      saveProfile: "保存资料",
      username: "用户昵称",
      premiumNotice: "免费版仅展示前 5 只股票，升级会员解锁日经 225 全量大庄股异动流",
      memberExclusive: "收藏功能为会员专享，请先升级会员",
    }
  },
  en: {
    translation: {
      brand: "WHALE WATCH",
      subtitle: "Global Japanese Stock Alert",
      marketClosed: "Market Closed / Archiving",
      marketOpen: "Live Trading / Fetching",
      volume: "Volume",
      latest: "LIVE",
      connected: "CONNECTED",
      periodDaily: "1M / 1Y Daily",
      periodWeekly: "10Y Weekly",
      radarButton: "LAUNCH NIKKEI 225 RADAR",
      patchTime: "Live API Patch Time",
      lockedTime: "Volume Target Time",
      todayWhale: "Top 3 Whale Alert (Today)",
      radarTitle: "Nikkei 225 Whale Radar",
      whaleScore: "Score",
      aiAnalysis: "AI Analytics",
      aiOpinion: "AI Opinion",
      newsTitle: "Institutional Activity News",
      stock_9983: "Fast Retailing (9983)",
      stock_9984: "SoftBank Group (9984)",
      stock_6758: "Sony Group (6758)",
      stock_7203: "Toyota Motor (7203)",
      reason_whale: "Massive institutional 'Whale Order' detected in mid-day trading.",
      reason_ma: "Broke above 25-day MA critical resistance.",
      reason_dump: "High-level profit-taking with low baseline volume.",
      reason_normal: "Standard index rebalancing flow.",

      // 🌟 新增会员与账户相关词条
      login: "Login",
      logout: "Logout",
      premiumUser: "Premium Member",
      freeUser: "Free Account",
      upgradeBtn: "Upgrade to Premium",
      myFavorites: "My Watchlist",
      editProfile: "Edit Profile",
      saveProfile: "Save Changes",
      username: "Username",
      premiumNotice: "Free version limits to 5 stocks. Upgrade to unlock all Nikkei 225 whale streams.",
      memberExclusive: "Watchlist is premium exclusive. Please upgrade.",
    }
  },
  ja: {
    translation: {
      brand: "クジラ監視レーダー",
      subtitle: "日本株異常動向アラート",
      marketClosed: "取引時間外 / データ集計中",
      marketOpen: "ザラ場リアルタイム更新中",
      volume: "出来高",
      latest: "現在値",
      connected: "接続中",
      periodDaily: "1ヶ月/1年 日足",
      periodWeekly: "10年 週足",
      radarButton: "日経225異常シグナル検知",
      patchTime: "ザラ場API更新時間",
      lockedTime: "出来高対応時間",
      todayWhale: "本日の異常動向銘柄 (Top 3)",
      radarTitle: "日経225 異常動向レーダー",
      whaleScore: "異常スコア",
      aiAnalysis: "AI インテリジェンス分析",
      aiOpinion: "AI 独占見解",
      newsTitle: "最近の機関投資家動向ニュース",
      stock_9983: "ファーストリテイリング (9983)",
      stock_9984: "ソフトバンクグループ (9984)",
      stock_6758: "ソニーグループ (6758)",
      stock_7203: "トヨタ自動車 (7203)",
      reason_whale: "ザラ場に巨大なクジラ注文を検知。",
      reason_ma: "25日移動平均線を突破。",
      reason_dump: "高値圏での利益確定売りが先行。",
      reason_normal: "インデックスのリバランシングに伴う通常の資金移動。",

      // 🌟 新增会员与账户相关词条
      login: "ログイン",
      logout: "ログアウト",
      premiumUser: "プレミアム会員",
      freeUser: "無料アカウント",
      upgradeBtn: "プレミアムにアップグレード",
      myFavorites: "お気に入り銘柄",
      editProfile: "プロフィール編集",
      saveProfile: "変更を保存",
      username: "ユーザー名",
      premiumNotice: "無料版は5件まで表示。プレミアム登録で日経225全銘柄を解放。",
      memberExclusive: "お気に入り機能はプレミアム限定です。アップグレードしてください。",
    }
  },
  ko: {
    translation: {
      brand: "고래 감시 레이더",
      subtitle: "일본주식 이상동향 글로벌 알림",
      marketClosed: "장마감 / 오프라인 데이터 집계중",
      marketOpen: "장중 실시간 새로고침 중",
      volume: "거래량",
      latest: "현재가",
      connected: "연결됨",
      periodDaily: "1개월/1년 일봉",
      periodWeekly: "10년 주봉",
      radarButton: "닛케이 225 이상동향 스캔 시작",
      patchTime: "장중 API 패치 시간",
      lockedTime: "거래량 대응 시간",
      todayWhale: "오늘의 고래 이상동향 (Top 3)",
      radarTitle: "닛케이 225 이상동향 레이더",
      whaleScore: "이상 지수",
      aiAnalysis: "AI 인텔리전스 분석",
      aiOpinion: "AI 독점 견해",
      newsTitle: "최근 기관 투자자 동향 뉴스",
      stock_9983: "패스트 리테일링 (9983)",
      stock_9984: "소프트뱅크 그룹 (9984)",
      stock_6758: "소니 그룹 (6758)",
      stock_7203: "토요타 자동차 (7203)",
      reason_whale: "장중 초대형 기관 주문 포착.",
      reason_ma: "25일 이동평균선 핵심 저항선 돌파.",
      reason_dump: "고점 매물 출회 및 차익 실현 선행.",
      reason_normal: "지수 편입 비중 조절에 따른 정상적 자금이동.",

      // 🌟 新增会员与账户相关词条
      login: "로그인",
      logout: "로그아웃",
      premiumUser: "프리미엄 회원",
      freeUser: "무료 계정",
      upgradeBtn: "프리미엄으로 업그레이드",
      myFavorites: "관심 종목",
      editProfile: "프로필 편집",
      saveProfile: "변경사항 저장",
      username: "사용자 이름",
      premiumNotice: "무료 버전은 5개 종목으로 제한됩니다. 프리미엄 업그레이드로 닛케이 225 전체 개방.",
      memberExclusive: "관심 종목 기능은 프리미엄 전용입니다. 업그레이드 해주세요.",
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export function formatStockTime(jstTimeString: string, targetZone: 'JST' | 'local' = 'JST') {
  const jstTime = dayjs.tz(jstTimeString, "YYYY-MM-DD HH:mm:ss", "Asia/Tokyo");

  if (targetZone === 'JST') {
    return jstTime.format('YYYY-MM-DD HH:mm:ss [JST]');
  }

  // 核心修正：在 i18next 彻底初始化前，保护性使用 i18n.language
  const currentLang = i18n.language || 'zh';
  if (currentLang === 'ko') {
    return jstTime.local().format('YYYY-MM-DD HH:mm:ss [로컬]');
  }
  return jstTime.local().format('YYYY-MM-DD HH:mm:ss [Local]');
}

export default i18n;