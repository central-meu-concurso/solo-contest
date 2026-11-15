// Escolhe onde os dados ficam:
//  - com as chaves do Supabase (.env): contas + dados na nuvem, sincronizados entre site e celular
//  - sem as chaves: modo local (sem login, dados só neste aparelho) — útil para testar
import { hasSupabase } from './supabase';
import { localApi } from './localClient';
import { remoteApi } from './remoteClient';

export const api = hasSupabase ? remoteApi : localApi;
export { hasSupabase };
