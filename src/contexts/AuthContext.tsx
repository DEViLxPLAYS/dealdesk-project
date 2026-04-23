import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchingRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // ── Profile fetcher (runs OUTSIDE onAuthStateChange to avoid GoTrue lock contention) ──
  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
      fetchingRef.current = false;
    }, 10000);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_id, full_name, role, onboarded, avatar_url, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      let resolvedProfile = data as Profile | null;

      // ── AUTO-RECOVERY ──────────────────────────────────────────────────────────
      // If the profile has no company_id (link was broken by schema reset or bug),
      // find any company this user created (created_by = userId) and re-link it.
      if (resolvedProfile && !resolvedProfile.company_id) {
        try {
          const { data: ownedCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('created_by', userId)
            .maybeSingle();

          if (ownedCompany?.id) {
            await supabase
              .from('profiles')
              .update({ company_id: ownedCompany.id, onboarded: true })
              .eq('id', userId);

            resolvedProfile = {
              ...resolvedProfile,
              company_id: ownedCompany.id,
              onboarded: true,
            };
            console.log('[AuthContext] Auto-recovered company_id for user:', userId);
          }
        } catch (recoveryErr) {
          console.warn('[AuthContext] Auto-recovery failed (non-fatal):', recoveryErr);
        }
      }
      // ───────────────────────────────────────────────────────────────────────────

      setProfile(resolvedProfile);
    } catch (err) {
      console.error('[AuthContext] fetchProfile error:', err);
      setProfile(null);
    } finally {
      clearTimeout(safetyTimer);
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // ── Auth state listener — LIGHTWEIGHT, no DB calls inside ─────────────────────
  // We only track session/user here. Profile is fetched in a separate effect
  // below so it never runs inside the GoTrue lock window.
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // If signed out, clear everything immediately
        if (!currentSession?.user) {
          setProfile(null);
          setIsLoading(false);
          fetchingRef.current = false;
          currentUserIdRef.current = null;
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ── Profile fetch — only re-runs when the logged-in user ID actually changes ──
  // This deliberately does NOT re-run on TOKEN_REFRESHED (same userId = no re-run).
  // That is correct: we don't need to re-fetch the profile on every token refresh.
  useEffect(() => {
    if (!user?.id) return;

    // If same user as before (e.g. token refresh), skip — profile already in state
    if (currentUserIdRef.current === user.id && profile !== null) return;

    currentUserIdRef.current = user.id;
    fetchProfile(user.id);
  }, [user?.id, fetchProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── refreshProfile — forces a fresh fetch of the current user's profile ───────
  // Call this after any operation that updates the profile row (e.g. onboarding).
  const refreshProfile = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.user) {
      fetchingRef.current = false;     // reset guard so fetch can run
      currentUserIdRef.current = null; // reset cache so it re-fetches
      await fetchProfile(s.user.id);
    }
  }, [fetchProfile]);

  const signOut = async () => {
    setProfile(null);
    currentUserIdRef.current = null;
    await supabase.auth.signOut();
  };

  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isSuperAdmin, signOut, refreshProfile }}>
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
