import React, { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, User, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import AuthDivider from "@/components/AuthDivider";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { friendlyError } from "@/lib/authActions";

export default function Register() {
  const { user, signUp, verifySignupCode, resendSignupCode, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingEmail = location.state?.verifyEmail || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(pendingEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(Boolean(pendingEmail));
  const [otpCode, setOtpCode] = useState("");

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { needsCode } = await signUp({ email, password, fullName });
      if (needsCode) setShowOtp(true);
      else navigate("/", { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      await verifySignupCode(email, otpCode);
      navigate("/", { replace: true });
    } catch (err) {
      setError(friendlyError(err));
      setOtpCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await resendSignupCode(email);
      toast({ title: "Código enviado", description: "Verifique seu e-mail para o novo código." });
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Verifique seu e-mail" subtitle={`Enviamos um código para ${email}`}
        footer={<Link to="/login" className="text-primary font-medium hover:underline">Voltar ao login</Link>}>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">{error}</div>
        )}

        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verificando...</>) : "Verificar"}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Não recebeu o código?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">Reenviar</button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Criar sua conta"
      subtitle="Seu progresso fica salvo e disponível no site e no celular"
      footer={
        <>
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
        </>
      }
    >
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={handleGoogle}>
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continuar com Google
      </Button>

      <AuthDivider />

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Como quer ser chamado(a)? <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="name" type="text" autoComplete="given-name" placeholder="Seu nome" value={fullName}
              onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={password}
              onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</>) : "Criar conta"}
        </Button>
      </form>
    </AuthLayout>
  );
}
