import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, logout as apiLogout, refreshToken } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // checking session on mount

  // Try to restore session on app load
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { setLoading(false); return; }
      try {
        const data = await getMe();
        setUser(data.user);
      } catch {
        // Access token expired — try refresh
        try {
          const data = await refreshToken();
          localStorage.setItem('accessToken', data.accessToken);
          setUser(data.user);
        } catch {
          localStorage.removeItem('accessToken');
        }
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const loginUser = useCallback((token, userData) => {
    localStorage.setItem('accessToken', token);
    setUser(userData);
  }, []);

  const logoutUser = useCallback(async () => {
    try { await apiLogout(); } catch { /* silent */ }
    localStorage.removeItem('accessToken');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
