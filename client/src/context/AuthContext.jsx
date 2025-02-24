// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth(token);
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      console.log('Checking auth with token:', token ? 'Present' : 'None');
      
      const response = await api.get('/api/auth/admin/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Auth check response:', {
        success: true,
        hasData: !!response.data
      });
      
      setAdmin(response.data);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Auth check failed:', error.message);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Login attempt:', { email });
      
      const response = await api.post('/api/auth/admin/login', { email, password });
      
      console.log('Login response:', {
        success: true,
        hasToken: !!response.data.token
      });

      const { token, admin: adminData } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAdmin(adminData);

      return response.data;
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setAdmin(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        admin, 
        login, 
        logout,
        loading 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};