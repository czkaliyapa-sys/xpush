import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error('Failed to load user:', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    setUser(userData);
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
    } catch (e) {
      console.error('Failed to save user:', e);
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      await SecureStore.deleteItemAsync('user');
    } catch (e) {
      console.error('Failed to delete user:', e);
    }
  };

  const updateUser = async (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
