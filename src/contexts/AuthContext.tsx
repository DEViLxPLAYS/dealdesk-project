import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchingRef = useRef(false); // prevents double fetch

  const fetchProfile = async (userId: string) => {
    // Prevent duplicate concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    // Safety timeout — never hang loading forever
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
      fetchingRef.current = false;
    }, 8000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_id, full_name, role, onboarded, avatar_url, created_at')
        .eq('id', userId)
        .maybeSingle(); // maybeSingle won't throw if no row found

      if (error) throw error;
      setProfile(data as Profile | null);
    } catch (err) {
      console.error('fetchProfile error:', err);
      setProfile(null);
    } finally {
      clearTimeout(safetyTimer);
      setIsLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Use onAuthStateChange as the SINGLE source of truth.
    // It fires immediately with the current session on mount (INITIAL_SESSION event),
    // so we do NOT need a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
          fetchingRef.current = false;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isSuperAdmin, signOut }}>
      {children}
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
