import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { UserRole } from '@riverside/shared';
import { supabase } from '../lib/supabase';
import { env } from '../config/env';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const pendingWelcomeKey = 'riverside.pendingWelcomeEmail';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        if (!data.session) setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(!nextSession);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.access_token) {
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetch(`${env.VITE_API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load your profile');
        return response.json() as Promise<{ role: UserRole }>;
      })
      .then((profile) => setRole(profile.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    if (!session || window.localStorage.getItem(pendingWelcomeKey) !== 'true') return;
    window.localStorage.removeItem(pendingWelcomeKey);
    void fetch(`${env.VITE_API_URL}/api/email/welcome`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
  }, [session]);

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin + '/login' },
    });
    if (signUpError) {
      setError(signUpError.message);
      throw signUpError;
    }
    window.localStorage.setItem(pendingWelcomeKey, 'true');
    if (data.session) {
      window.localStorage.removeItem(pendingWelcomeKey);
      await fetch(`${env.VITE_API_URL}/api/email/welcome`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
    }
    return { needsEmailConfirmation: !data.session };
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      throw signInError;
    }
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  };

  return <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, error, signUp, signIn, signOut, clearError: () => setError(null) }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
