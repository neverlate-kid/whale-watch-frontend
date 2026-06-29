// src/context/user-context.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface UserContextType {
  isLoggedIn: boolean;
  isPremium: boolean;
  favorites: string[];
  session: Session | null;
  toggleFavorite: (ticker: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  // 为了测试，默认开启高级权限。后续可以根据 session.user 的 metadata 判断
  const [isPremium, setIsPremium] = useState<boolean>(true); 

  useEffect(() => {
    // 1. 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. 监听登录状态改变 (登录、登出、Token 刷新)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleFavorite = (ticker: string) => {
    setFavorites(prev => 
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    );
    // TODO: 这里后续可以加上请求 FastAPI 接口同步到数据库的逻辑
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    isLoggedIn: !!session,
    isPremium,
    favorites,
    session,
    toggleFavorite,
    logout
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useAppUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useAppUser must be used within a UserProvider');
  return context;
};