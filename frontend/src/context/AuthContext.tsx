import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('vdc_token');
        const storedUser = localStorage.getItem('vdc_user');
        
        if (storedToken && storedUser) {
          // Verify token is still valid
          const isValid = await authService.verifyToken(storedToken);
          if (isValid) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Clear invalid session
            localStorage.removeItem('vdc_token');
            localStorage.removeItem('vdc_user');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('vdc_token');
        localStorage.removeItem('vdc_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      
      setUser(response.user);
      setToken(response.token);
      
      // Store in localStorage
      localStorage.setItem('vdc_token', response.token);
      localStorage.setItem('vdc_user', JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vdc_token');
    localStorage.removeItem('vdc_user');
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
