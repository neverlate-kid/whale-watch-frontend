import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

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
  // 🌟 新增：携带 Token 的专属请求方法，用于调用需要鉴权的 FastAPI 后端
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [username, setUsername] = useState('WhaleHunter_99');
  const [favorites, setFavorites] = useState<string[]>(['9983.T', '9984.T']);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // 降级模式：没配 Supabase 时默认给足权限，方便本地测试 UI
    if (!supabase) {
      setIsLoggedIn(true);
      setIsPremium(true);
      return; 
    }
    
    // 1. 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoggedIn(!!session);
      // 真实环境下，这里可以根据 session 里的 user.metadata 设置 isPremium
      if (session) setIsPremium(true); 
    });

    // 2. 监听 Supabase 登录状态改变
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoggedIn(!!session);
      if (session) setIsPremium(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🌟 核心：封装一个自动携带 JWT Token 的 fetch 函数
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    
    // 如果配置了 Supabase 且当前有会话，就把 Token 塞进 Header 里
    if (supabase && session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }

    return fetch(url, { ...options, headers });
  };

  // 降级测试用方法
  const login = () => setIsLoggedIn(true); 
  
  const logout = async () => {
    setIsLoggedIn(false);
    setIsPremium(false);
    setFavorites([]);
    setSession(null);
    if (supabase) await supabase.auth.signOut();
  };
  
  const togglePremium = () => setIsPremium(!isPremium);

  const toggleFavorite = (ticker: string): boolean => {
    if (!isPremium) return false;
    
    const newFavorites = favorites.includes(ticker) 
      ? favorites.filter(t => t !== ticker) 
      : [...favorites, ticker];
      
    setFavorites(newFavorites);

    // 🌟 发送给受保护的 FastAPI 后端 (降级模式下静默失败，不影响前端 UI)
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    authFetch(`${baseUrl}/api/v1/user/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFavorites)
    }).catch(err => console.warn("后台同步失败 (本地测试模式，尚未配置后端 Token)", err));

    return true;
  };

  const updateUsername = (name: string) => setUsername(name);

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