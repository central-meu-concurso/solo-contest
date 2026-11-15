import { Capacitor } from '@capacitor/core';

// true quando o app está rodando empacotado no Android (e não no navegador).
export const isNative = Capacitor.isNativePlatform();

// Endereço que o Google/Supabase usam para devolver a pessoa ao app depois do login.
// O Android abre o app por este "link profundo" (declarado no AndroidManifest.xml).
export const APP_LOGIN_URL = 'solocontest://auth';

// Endereço público do site. Troque aqui quando o domínio próprio estiver no ar.
export const WEB_URL = 'https://central-meu-concurso.github.io/solo-contest/';
