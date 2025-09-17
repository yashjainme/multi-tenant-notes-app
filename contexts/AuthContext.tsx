'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, UserWithTenant, Tenant } from '@/types';
import { storage, getApiUrl } from '@/lib/utils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithTenant | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = storage.get('auth-token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl('/auth/me'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { data } = await response.json();
        setUser(data);
        setTenant(data.tenant);
      } else {
        // Token is invalid, remove it
        storage.remove('auth-token');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      storage.remove('auth-token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        const { user: userData, token } = data.data;
        
        // Store token
        storage.set('auth-token', token);
        
        // Update state
        setUser(userData);
        setTenant(userData.tenant);
        
        return true;
      } else {
        console.error('Login failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    const token = storage.get('auth-token');
    
    try {
      if (token) {
        await fetch(getApiUrl('/auth/logout'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      storage.remove('auth-token');
      setUser(null);
      setTenant(null);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const token = storage.get('auth-token');
    
    if (!token) {
      setUser(null);
      setTenant(null);
      return;
    }

    try {
      const response = await fetch(getApiUrl('/auth/me'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { data } = await response.json();
        setUser(data);
        setTenant(data.tenant);
      } else {
        // Token is invalid
        storage.remove('auth-token');
        setUser(null);
        setTenant(null);
      }
    } catch (error) {
      console.error('User refresh error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    tenant,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for checking if user is admin
export function useIsAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === 'admin';
}

// Custom hook for getting auth token
export function useAuthToken(): string | null {
  return storage.get('auth-token');
}