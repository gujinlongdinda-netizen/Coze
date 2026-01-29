import React, { createContext, useState, useEffect } from "react";
import { db } from "../lib/db";
import { getCurrentUser } from "../api/auth";
import { buildApiUrl } from "../config/api";

// 用户信息接口
export interface UserInfo {
  id: string;
  email?: string;
  phone?: string;
  remainingWords: number;
  isFirstTime: boolean;
  lastUsedDate: string;
}

// 认证上下文接口
interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => Promise<void>;
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo) => void;
  updateRemainingWords: (words: number) => void;
  loading: boolean;
}

// 创建认证上下文
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
  logout: async () => {},
  userInfo: null,
  setUserInfo: () => {},
  updateRemainingWords: () => {},
  loading: true,
});

// 认证提供者组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // 检查后端session状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        const userInfo: UserInfo = {
          id: user.id,
          email: user.email,
          phone: user.phone,
          remainingWords: user.remainingWords,
          isFirstTime: user.isFirstUser,
          lastUsedDate: new Date().toISOString(),
        };
        setIsAuthenticated(true);
        setUserInfo(userInfo);
        db.setCurrentUser(userInfo);
      } catch (error) {
        // Session无效，清除本地存储
        setIsAuthenticated(false);
        setUserInfo(null);
        db.clearCurrentUser();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 更新用户信息时同步到数据库
  useEffect(() => {
    if (userInfo) {
      db.setCurrentUser(userInfo);
    }
  }, [userInfo]);

  // 退出登录
  const logout = async () => {
    try {
      // 清除后端session
      await fetch(buildApiUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("清除session失败:", error);
    } finally {
      // 清除前端状态
      setIsAuthenticated(false);
      setUserInfo(null);
      db.clearCurrentUser();
    }
  };

  // 更新剩余字数
  const updateRemainingWords = (words: number) => {
    if (userInfo) {
      const updatedUser = { ...userInfo, remainingWords: words };
      setUserInfo(updatedUser);

      // 同时更新数据库中的用户信息
      try {
        db.updateRemainingWords(userInfo.id, words);
      } catch (error) {
        console.error('更新剩余字数失败:', error);
      }
    }
  };

  // 提供上下文值
  const contextValue: AuthContextType = {
    isAuthenticated,
    setIsAuthenticated,
    logout,
    userInfo,
    setUserInfo,
    updateRemainingWords,
    loading,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}