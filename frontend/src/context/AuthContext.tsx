import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginApi, getMeApi, logoutApi, type User, type ApiErrorResponse } from '../services/api';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (loginInput: string, passwordInput: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate user session via GET /api/auth/me on app load
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await getMeApi();
          if (res?.success && res?.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            // Clear invalid session
            clearAuthSession();
          }
        } catch {
          // Token is invalid, expired, or backend rejected it -> clear session completely
          clearAuthSession();
        }
      } else {
        clearAuthSession();
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const clearAuthSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('superadmin_user');
  };

  const login = async (loginInput: string, passwordInput: string) => {
    try {
      // Direct call to POST /api/auth/login endpoint
      const response = await loginApi(loginInput, passwordInput);
      
      if (!response.success || !response.data?.token || !response.data?.user) {
        throw new Error(response.message || 'Login failed');
      }

      const { token: receivedToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('user', JSON.stringify(receivedUser));
    } catch (err: unknown) {
      // Clear any partial auth state on login error
      clearAuthSession();

      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          const apiErr = err.response.data as ApiErrorResponse;
          if (apiErr.errors && apiErr.errors.length > 0) {
            throw new Error(apiErr.errors.map((e) => e.message).join(', '));
          }
          if (apiErr.message || apiErr.error) {
            throw new Error(apiErr.message || apiErr.error);
          }
        }
        if (err.code === 'ERR_NETWORK') {
          throw new Error('Cannot connect to backend server at http://localhost:5000. Please ensure the backend is running.');
        }
      }
      
      if (err instanceof Error) {
        throw err;
      }

      throw new Error('Authentication failed. Invalid login or password.');
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout network errors
    } finally {
      clearAuthSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
