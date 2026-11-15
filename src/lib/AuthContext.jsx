import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, hasSupabase } from '@/api/supabase';
import * as actions from '@/lib/authActions';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { isNative, APP_LOGIN_URL } from '@/lib/native';

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

    // Android: o login do Google termina no navegador e volta ao app por solocontest://auth?code=...
    let urlListener = null;
    if (isNative) {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        if (!url || !url.startsWith(APP_LOGIN_URL)) return;
        try {
          const code = new URL(url).searchParams.get('code');
          if (code) await supabase.auth.exchangeCodeForSession(code);
        } catch (e) {
          console.error('Falha ao concluir o login com Google', e);
        }
        try { await Browser.close(); } catch { /* o navegador do Android fecha sozinho */ }
      }).then((h) => { urlListener = h; });
    }

    return () => {
      active = false;
      data.subscription.unsubscribe();
      urlListener?.remove();
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
