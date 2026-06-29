import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';

interface UserContextType {
  isLoggedIn: boolean;
  isPremium: boolean;
  username: string;
  favorites: string[];
  session: Session | null;
  login: () => void;
  logout: () => void;
  togglePremium: () => void;
  toggleFavorite: (ticker: string) => boolean;
  updateUsername: (name: string) => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  // 🌟 生产环境规范：所有状态初始值严格为空/False，绝不写死任何假数据
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);

  // ==========================
  // 1. 严格监听真实的云端登录状态
  // ==========================
  useEffect(() => {
    if (!supabase) return; // 没配置云环境，就是彻彻底底的未登录，绝不造假
    
    // 初始化时获取会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoggedIn(!!session);
      if (session) {
        setIsPremium(true); // TODO: 真实环境下，应根据 session.user.app_metadata 里的订阅字段判断
        // 动态解析真实用户名：优先取自定义的 username，否则用邮箱前缀兜底
        const name = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User';
        setUsername(name);
      }
    });

    // 监听 Auth 变化（登入、登出、Token刷新）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoggedIn(!!session);
      if (session) {
        setIsPremium(true);
        const name = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User';
        setUsername(name);
      } else {
        // 登出时，严格清空所有内存敏感数据
        setIsPremium(false);
        setFavorites([]);
        setUsername('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ==========================
  // 2. 登录成功后，向 FastAPI 拉取真实的收藏夹
  // ==========================
  useEffect(() => {
    const fetchFavoritesFromServer = async () => {
      try {
        const baseUrl = process.env.EXPO_PUBLIC_API_URL;
        if (!baseUrl) {
          console.warn("⚠️ 未配置后端 API 环境变量 (EXPO_PUBLIC_API_URL)，停止拉取收藏夹");
          return;
        }
        const headers = new Headers();
        if (session?.access_token) {
          headers.set('Authorization', `Bearer ${session.access_token}`);
        }

        const response = await fetch(`${baseUrl}/api/v1/user/favorites`, { headers });
        if (response.ok) {
          const json = await response.json();
          if (json.success && Array.isArray(json.data)) {
            setFavorites(json.data); 
          }
        }
      } catch (error) {
        console.warn("⚠️ 获取云端收藏夹失败:", error);
      }
    };

    if (isLoggedIn && session) {
      fetchFavoritesFromServer();
    } else {
      setFavorites([]); 
    }
  }, [isLoggedIn, session]);

  // ==========================
  // 3. 核心网络层：自动携带 JWT Token 的专属 Fetch
  // ==========================
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
    return fetch(url, { ...options, headers });
  };

  // 手动触发状态（仅供调试或由外部 Modal 补充逻辑使用，不污染真实鉴权流）
  const login = () => { /* 真实环境由 onAuthStateChange 自动接管，此处留空即可 */ }; 
  
  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };
  
  const togglePremium = () => setIsPremium(!isPremium);

  // ==========================
  // 4. 业务逻辑：同步收藏夹到云端
  // ==========================
  const toggleFavorite = (ticker: string): boolean => {
    if (!isPremium) return false;
    
    const newFavorites = favorites.includes(ticker) 
      ? favorites.filter(t => t !== ticker) 
      : [...favorites, ticker];
      
    setFavorites(newFavorites);

    const baseUrl = process.env.EXPO_PUBLIC_API_URL;
    authFetch(`${baseUrl}/api/v1/user/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFavorites)
    }).catch(err => console.warn("后台同步失败", err));

    return true;
  };

  // ==========================
  // 5. 业务逻辑：同步用户名到 Supabase
  // ==========================
  const updateUsername = async (name: string) => {
    setUsername(name);
    // 正式环境：不仅改内存，还要真正写入 Supabase 的 user_metadata 里
    if (supabase && session) {
      const { error } = await supabase.auth.updateUser({
        data: { username: name }
      });
      if (error) console.error("同步用户名到云端失败:", error);
    }
  };

  return (
    <UserContext.Provider value={{ 
      isLoggedIn, isPremium, username, favorites, session,
      login, logout, togglePremium, toggleFavorite, updateUsername, authFetch 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useAppUser must be used within UserProvider');
  return context;
}