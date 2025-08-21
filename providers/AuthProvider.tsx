/**
 * AuthProvider.tsx
 *
 * This provider manages authentication state and operations throughout the app.
 * It handles user authentication, registration, and session management using JWT tokens.
 * The provider uses SecureStore for native platforms and localStorage for web to persist auth data.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface AuthProps {
  authState: {
    token: string | null;
    jwt: string | null;
    authenticated: boolean | null;
    user_id: string | null;
    role: string | null;
    email: string | null;
  };
  onRegister: (email: string, password: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  initialized: boolean;
  isTherapist: boolean;
}

const TOKEN_KEY = 'user-jwt';

export const API_URL = Platform.select({
  ios: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  android: 'http://10.0.2.2:3000',
  web: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
}) || 'http://localhost:3000';

console.log('API Base URL:', API_URL);

const AuthContext = createContext<AuthProps | undefined>(undefined);

const storage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return await SecureStore.setItemAsync(key, value);
  },
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return await SecureStore.deleteItemAsync(key);
  },
};

const EMPTY_AUTH_STATE = {
  token: null,
  jwt: null,
  authenticated: null,
  user_id: null,
  role: null,
  email: null,
};

// Custom API call function using fetch
const apiCall = async (endpoint: string, method: string, body?: any, token?: string) => {
  const url = `${API_URL}${endpoint}`;
  console.log(`${method} ${url}`, body ? `Body: ${JSON.stringify(body)}` : '');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      data = text;
    }

    console.log('API Response:', response.status, data);

    if (!response.ok) {
      const errorMessage = data?.msg || data?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

export const AuthProvider = ({ children }: any) => {
  const [authState, setAuthState] = useState<{
    token: string | null;
    jwt: string | null;
    authenticated: boolean | null;
    user_id: string | null;
    role: string | null;
    email: string | null;
  }>(EMPTY_AUTH_STATE);
  const [initialized, setInitialized] = useState(false);

  // Set up response interceptor for 401 handling
  useEffect(() => {
    // We'll handle 401 errors in the apiCall function
  }, [authState.token]);

  // On component mount, try to load the saved token from storage
  useEffect(() => {
    const loadToken = async () => {
      try {
        const data = await storage.getItem(TOKEN_KEY);
        if (data) {
          const object = JSON.parse(data);
          updateAuthStateFromToken(object);
          console.log('Token loaded from storage');
        }
      } catch (error) {
        console.error('Error loading token:', error);
      }
      setInitialized(true);
    };
    loadToken();
  }, []);

  const updateAuthStateFromToken = (object: any) => {
    console.log('Updating auth state with:', object); // Debug log
    setAuthState({
      token: object.token,
      jwt: object.jwt,
      authenticated: true,
      user_id: object.user?.id || null,
      role: object.user?.role || null,
      email: object.user?.email || null,
    });
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in with:', { email });
      
      const data = await apiCall('/auth/login', 'POST', { email, password });
      
      console.log('Sign in successful:', data);
      
      updateAuthStateFromToken(data);
      await storage.setItem(TOKEN_KEY, JSON.stringify(data));
      return data;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string) => {
    try {
      console.log('Attempting registration with:', { email });
      
      const data = await apiCall('/auth/register', 'POST', { email, password });
      
      console.log('Registration successful:', data);
      
      updateAuthStateFromToken(data);
      await storage.setItem(TOKEN_KEY, JSON.stringify(data));
      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  };

  const signOut = async () => {
    await storage.removeItem(TOKEN_KEY);
    setAuthState(EMPTY_AUTH_STATE);
    console.log('User signed out');
  };

  // Calculate isTherapist inside the component so it updates properly
  const isTherapist = authState.role === 'therapist';

  const value: AuthProps = {
    onRegister: register,
    signIn,
    signOut,
    authState,
    initialized,
    isTherapist, // This will now update properly
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};