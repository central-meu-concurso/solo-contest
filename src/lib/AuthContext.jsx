import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, hasSupabase } from '@/api/supabase';
import * as actions from '@/lib/authActions';

const AuthContext = createContext(null);

const LOCAL_USER = { id: 'local-user', email: '', full_name: '' };

const mapUser = (u) => ({ id: u.id, email: u.email, full_name: u.user_metadata?.full_name || '' });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(hasSupabase);

  useEffect(() => {
    if (!hasSupabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      isCloud: hasSupabase,
      isLoading: loading,
      user: hasSupabase ? (session?.user ? mapUser(session.user) : null) : LOCAL_USER,
      ...actions,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
