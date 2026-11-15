import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/api/client';
import { Settings, RotateCcw, Loader2, Check, UserX } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DangerConfirmDialog from '@/components/ui/DangerConfirmDialog';
import { useAuth } from '@/lib/AuthContext';

export default function SettingsPage() {
  const { isCloud, deleteAccount } = useAuth();
  const [stats, setStats] = useState(null);
  const [intervals, setIntervals] = useState([1, 7, 15, 30]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | saving | saved
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const firstRun = useRef(true);
  const saveTimer = useRef(null);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      if (isCloud) {
        // apaga fotos, dados e a própria conta no servidor; depois volta para o login
        await deleteAccount();
        window.location.hash = '#/login';
        return;
      }
      // modo local: apaga os dados guardados neste aparelho
      const entities = ['StudySession', 'Review', 'ReviewLog', 'QuestionLog', 'StudyMaterial', 'Topic', 'Subject', 'StudyPlan', 'UserStats', 'Backup'];
      for (const name of entities) {
        await api.entities[name].deleteMany({});
      }
      api.auth.logout('/');
    } catch (err) {
      console.error(err);
      alert('Não foi possível concluir: ' + (err?.message || 'erro desconhecido'));
      setDeletingAccount(false);
      setDeleteAccountOpen(false);
    }
  };

  useEffect(() => {
    async function load() {
      const s = await api.entities.UserStats.list('-created_date', 1);
      if (s[0]) {
        setStats(s[0]);
        setIntervals(s[0].review_intervals || [1, 7, 15, 30]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (intervals.length === 0) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const validIntervals = intervals.filter(i => i > 0).sort((a, b) => a - b);
      setStatus('saving');
      if (stats) {
        await api.entities.UserStats.update(stats.id, { review_intervals: validIntervals });
      } else {
        const created = await api.entities.UserStats.create({ review_intervals: validIntervals, total_xp: 0, level: 1, current_streak: 0, longest_streak: 0 });
        setStats(created);
      }
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1500);
    }, 800);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervals]);

  const addInterval = () => {
    const last = intervals[intervals.length - 1] || 30;
    setIntervals([...intervals, last + 15]);
  };

  const removeInterval = (index) => {
    if (intervals.length <= 1) return;
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  const updateInterval = (index, value) => {
    const newIntervals = [...intervals];
    newIntervals[index] = Number(value);
    setIntervals(newIntervals);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Personalize seu sistema de estudos</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {status === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...</>}
          {status === 'saved' && <><Check className="w-3.5 h-3.5 text-emerald-400" /> Salvo</>}
        </span>
      </div>

      <GlassCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-purple-500/15">
            <RotateCcw className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold">Intervalos de Revisão</h2>
            <p className="text-xs text-muted-foreground">Configure quando as revisões serão agendadas (em dias)</p>
          </div>
        </div>

        <div className="space-y-3">
          {intervals.map((interval, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-20">{index + 1}ª revisão</span>
              <Input
                type="number"
                min={1}
                value={interval}
                onChange={e => updateInterval(index, e.target.value)}
                className="bg-muted/50 border-border/50 w-24"
              />
              <span className="text-xs text-muted-foreground">dia(s)</span>
              {intervals.length > 1 && (
                <button onClick={() => removeInterval(index)} className="text-xs text-red-400 hover:text-red-300">Remover</button>
              )}
            </div>
          ))}
        </div>

        <button onClick={addInterval} className="text-xs text-blue-400 hover:text-blue-300 mt-3">+ Adicionar intervalo</button>

        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/30">As alterações são salvas automaticamente.</p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-blue-500/15">
            <Settings className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold">Sobre</h2>
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Solo Contest</strong> — Assistente inteligente de estudos para concursos públicos.</p>
          <p>Sistema de ciclo de estudos rotativo, revisões espaçadas inteligentes e análise de desempenho com gamificação.</p>
          <p className="text-xs">Versão 1.0</p>
          <p className="text-xs">
            <a href="privacidade.html" target="_blank" rel="noreferrer" className="text-primary hover:underline">Política de privacidade</a>
            <span className="mx-2" aria-hidden="true">·</span>
            <a href="excluir-conta.html" target="_blank" rel="noreferrer" className="text-primary hover:underline">Como excluir a conta</a>
          </p>
        </div>
      </GlassCard>

      <GlassCard className="border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-red-500/15">
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-red-400">{isCloud ? 'Excluir minha conta' : 'Apagar meus dados'}</h2>
            <p className="text-xs text-muted-foreground">{isCloud ? 'Remove permanentemente a sua conta e todos os seus dados' : 'Remove permanentemente todos os dados guardados neste aparelho'}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Esta ação apaga definitivamente todos os planos, matérias, assuntos, sessões, revisões, questões, materiais, estatísticas e backups {isCloud ? 'da sua conta, inclusive nos outros aparelhos' : 'guardados neste aparelho'}. Não é possível desfazer.
        </p>
        <Button variant="destructive" onClick={() => setDeleteAccountOpen(true)} className="w-full sm:w-auto">
          <UserX className="w-4 h-4 mr-2" /> {isCloud ? 'Excluir minha conta' : 'Apagar todos os meus dados'}
        </Button>
      </GlassCard>

      <DangerConfirmDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        title={isCloud ? "Excluir conta?" : "Apagar todos os dados?"}
        description="Todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita."
        itemName="EXCLUIR"
        onConfirm={handleDeleteAccount}
        loading={deletingAccount}
      />
    </div>
  );
}
