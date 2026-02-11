"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, password2: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser?: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('auth/login/', {
        username,
        password,
      });

      const { access, refresh, user: userData } = response.data;

      // Store tokens and user data
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Login failed';
      toast.error(message);
      return false;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    password2: string,
    firstName: string = '',
    lastName: string = ''
  ): Promise<boolean> => {
    try {
      const response = await api.post('auth/register/', {
        username,
        email,
        password,
        password2,
        first_name: firstName,
        last_name: lastName,
      });

      toast.success('Registration successful! Please login.');
      return true;
    } catch (error: any) {
      const data = error.response?.data;
      const status = error.response?.status;

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // DRF validation errors: { field: ["msg"] } or { field: "msg" }
        const errorMessages = Object.entries(data)
          .map(([key, value]: [string, any]) => {
            if (Array.isArray(value)) {
              return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${String(value)}`;
          })
          .join('\n');
        toast.error(errorMessages || 'Registration failed.');
      } else if (data && typeof data === 'string') {
        toast.error(data);
      } else if (data?.detail) {
        toast.error(Array.isArray(data.detail) ? data.detail.join(', ') : data.detail);
      } else if (status === 500) {
        toast.error('Server error. Please try again or contact support.');
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        toast.error('Cannot reach server. Check that the backend is running and CORS is allowed.');
      } else {
        toast.error(`Registration failed (${status || 'error'}). Please try again.`);
      }
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (updates: Partial<User>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : (updates as User);
      try {
        localStorage.setItem('user', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save updated user to localStorage', e);
      }
      return updated;
    });
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

