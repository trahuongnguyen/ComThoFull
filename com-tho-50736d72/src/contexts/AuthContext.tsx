import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Profile } from '@/types';
import { authApi, TOKEN_EXPIRED_EVENT } from '@/lib/api';

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize user from localStorage immediately for fast rendering
  const [user, setUser] = useState<Profile | null>(() => {
    const storedUser = localStorage.getItem('pos_user');
    const token = localStorage.getItem('pos_token');
    if (token && storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    // Only set loading if we have stored credentials to verify
    const token = localStorage.getItem('pos_token');
    return !!token;
  });

  // Listen for token expiration events
  useEffect(() => {
    const handleTokenExpired = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
    return () => window.removeEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
  }, []);

  // Verify token in background (non-blocking)
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('pos_token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token by fetching profile
      const { data, error } = await authApi.getProfile();
      
      if (data && !error) {
        setUser(data);
        localStorage.setItem('pos_user', JSON.stringify(data));
      } else if (error === 'Token expired') {
        // Token is invalid, clear everything
        setUser(null);
      }
      // If network error, keep using stored user
      
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const { data, error } = await authApi.login(username, password);
    
    if (data && !error) {
      localStorage.setItem('pos_token', data.token);
      
      // Fetch user profile after successful login
      const { data: profileData, error: profileError } = await authApi.getProfile();
      
      if (profileData && !profileError) {
        setUser(profileData);
        localStorage.setItem('pos_user', JSON.stringify(profileData));
        return true;
      }
    }
    
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_shift');
    localStorage.removeItem('pos_invoices');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}