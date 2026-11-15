import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sem as chaves, o app roda em "modo local" (dados só neste aparelho, sem login).
export const hasSupabase = Boolean(url && anonKey);

export const supabase = hasSupabase
  ? createClient(url, anonKey, {
      auth: {
        flowType: 'pkce', // o retorno do Google vem em ?code=..., compatível com o roteador por #
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
