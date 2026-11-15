import { supabase } from '@/api/supabase';
import { Browser } from '@capacitor/browser';
import { isNative, APP_LOGIN_URL, WEB_URL } from '@/lib/native';

// Traduz as mensagens de erro do Supabase para português.
export function friendlyError(err) {
  const msg = (err?.message || '').toLowerCase();
  const code = err?.code || '';
  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) return 'Este e-mail ainda não foi confirmado.';
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('already registered') || msg.includes('already been registered')) return 'Este e-mail já está cadastrado. Tente entrar.';
  if (msg.includes('token has expired') || (msg.includes('invalid') && msg.includes('token')) || msg.includes('otp')) return 'Código inválido ou expirado. Peça um novo.';
  if (msg.includes('at least') && msg.includes('characters')) return 'A senha é muito curta. Use pelo menos 8 caracteres.';
  if (msg.includes('same as the old') || msg.includes('different from the old')) return 'Escolha uma senha diferente da anterior.';
  if (msg.includes('rate limit') || msg.includes('for security purposes') || code === 'over_email_send_rate_limit') return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'Sem conexão com a internet. Verifique e tente novamente.';
  if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) return 'Login com Google ainda não está ativado neste app.';
  return err?.message || 'Algo deu errado. Tente novamente.';
}

const siteUrl = () => (isNative ? WEB_URL : window.location.origin + window.location.pathname);

export async function signInWithPassword(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

// Retorna { needsCode: true } quando o e-mail precisa ser confirmado com o código enviado.
export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: fullName ? { full_name: fullName.trim() } : {}, emailRedirectTo: siteUrl() },
  });
  if (error) throw error;
  // Supabase não avisa que o e-mail já existe; devolve um usuário sem "identities".
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('User already registered');
  }
  return { needsCode: !data.session };
}

export async function verifySignupCode(email, code) {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' });
  if (error) throw error;
}

export async function resendSignupCode(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: siteUrl() } });
  if (error) throw error;
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: siteUrl() });
  if (error) throw error;
}

// Confere o código recebido por e-mail e já define a nova senha.
export async function resetPasswordWithCode(email, code, newPassword) {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'recovery' });
  if (error) throw error;
  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) throw updateError;
}

export async function signInWithGoogle() {
  if (isNative) {
    // O Google bloqueia login dentro do app (WebView). Abrimos o navegador do celular e voltamos por solocontest://auth.
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: APP_LOGIN_URL, skipBrowserRedirect: true },
    });
    if (oauthError) throw oauthError;
    await Browser.open({ url: data.url });
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: siteUrl() } });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Apaga fotos da pessoa, depois a conta (e todos os registros, por cascata no banco).
export async function deleteAccount() {
  const { data: u } = await supabase.auth.getUser();
  const uid = u?.user?.id;
  if (uid) {
    try {
      const { data: files } = await supabase.storage.from('study-images').list(uid, { limit: 1000 });
      if (files?.length) await supabase.storage.from('study-images').remove(files.map((f) => `${uid}/${f.name}`));
    } catch {
      // se não conseguir apagar as fotos, segue com a exclusão da conta
    }
  }
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
