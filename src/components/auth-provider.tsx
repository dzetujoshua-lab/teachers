"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile } from '@/lib/types'; // Assuming UserProfile is defined in your types

interface AuthContextType {
  profile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};