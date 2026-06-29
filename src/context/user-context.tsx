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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);

  // ==========================
  // 1. 严格监听真实的云端登录状态
  // ==========================
  useEffect(() => {
    if (!supabase) return; 
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoggedIn(!!session);
      if (session) {
        setIsPremium(true); 
        const name = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User';
        setUsername(name);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoggedIn(!!session);
      if (session) {
        setIsPremium(true);
        const name = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User';
        setUsername(name);
      } else {
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
  // 3. 核心网络层：专属 Fetch
  // ==========================
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
    return fetch(url, { ...options, headers });
  };

  const login = () => {}; 
  
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
    // 🌟 已修复：加上了严格的环境变量拦截
    if (baseUrl) {
      authFetch(`${baseUrl}/api/v1/user/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFavorites)
      }).catch(err => console.warn("后台同步失败", err));
    } else {
      console.warn("⚠️ 未配置后端 API 环境变量，收藏操作仅本地生效");
    }

    return true;
  };

  // ==========================
  // 5. 业务逻辑：同步用户名到 Supabase
  // ==========================
  const updateUsername = async (name: string) => {
    setUsername(name);
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