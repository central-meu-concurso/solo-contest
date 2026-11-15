import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, Lock, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/lib/AuthContext";
import { friendlyError } from "@/lib/authActions";

// Recuperação em 2 passos, tudo dentro do app: (1) pede o código por e-mail, (2) digita o código e a nova senha.
export default function ForgotPassword() {
  const { requestPasswordReset, resetPasswordWithCode } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setStep("code");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordWithCode(email, code, newPassword);
      navigate("/", { replace: true });
    } catch (err) {
      const msg = friendlyError(err);
      setError(msg);
      if (msg.startsWith("Código inválido")) setCode("");
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <Link to="/login" className="text-primary font-medium hover:underline">
      <ArrowLeft className="w-3 h-3 inline mr-1" />Voltar ao login
    </Link>
  );

  const errorBox = error && (
    <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">{error}</div>
  );

  if (step === "code") {
    return (
      <AuthLayout icon={Lock} title="Nova senha" subtitle={`Digite o código enviado para ${email}`} footer={footer}>
        {errorBox}
        <form onSubmit={reset} className="space-y-4">
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="new-password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="confirm-password" type="password" autoComplete="new-password" placeholder="••••••••"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 font-medium" disabled={loading || code.length < 6}>
            {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>) : "Redefinir senha"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Não recebeu o código?{" "}
          <button onClick={sendCode} className="text-primary font-medium hover:underline">Reenviar</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Mail} title="Recuperar senha" subtitle="Enviaremos um código para o seu e-mail" footer={footer}>
      {errorBox}
      <form onSubmit={sendCode} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder="voce@exemplo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>) : "Enviar código"}
        </Button>
      </form>
    </AuthLayout>
  );
}
