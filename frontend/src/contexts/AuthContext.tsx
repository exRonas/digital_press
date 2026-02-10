import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios defaults
// Use '/api' relative URL so Vite proxy (or Nginx) handles the forwarding
axios.defaults.baseURL = '/api';
axios.defaults.withCredentials = true; // For Sanctum cookies if used, but we'll also handle Bearer

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'operator';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        const response = await axios.get('/user');
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
    }
    setIsLoading(false);
  };

  const login = async (credentials: any) => {
    try {
        // CSRF protection for Sanctum
        // await axios.get('/sanctum/csrf-cookie'); 
        
        const response = await axios.post('/login', credentials);
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
    } catch (error) {
        throw error;
    }
  };

  const logout = async () => {
    try {
        await axios.post('/logout');
    } catch (error) {
        console.error(error);
    } finally {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isLoading, 
        login, 
        logout,
        isAuthenticated: !!user 
    }}>
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
