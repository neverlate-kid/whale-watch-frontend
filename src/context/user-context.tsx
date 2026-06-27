import React, { createContext, useContext, useState } from 'react';

interface UserContextType {
  isLoggedIn: boolean;
  isPremium: boolean;
  username: string;
  favorites: string[];
  login: () => void;
  logout: () => void;
  togglePremium: () => void;
  toggleFavorite: (ticker: string) => boolean;
  updateUsername: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [username, setUsername] = useState('WhaleHunter_99');
  const [favorites, setFavorites] = useState<string[]>(['9983.T']);

  const login = () => setIsLoggedIn(true);
  const logout = () => {
    setIsLoggedIn(false);
    setIsPremium(false);
    setFavorites([]);
  };
  const togglePremium = () => setIsPremium(!isPremium);

  const toggleFavorite = (ticker: string): boolean => {
    if (!isPremium) return false;
    setFavorites(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    );
    return true;
  };

  const updateUsername = (name: string) => setUsername(name);

  return (
    <UserContext.Provider value={{ isLoggedIn, isPremium, username, favorites, login, logout, togglePremium, toggleFavorite, updateUsername }}>
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useAppUser must be used within UserProvider');
  return context;
}