import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import moment from 'moment';
import { Database, Download, RotateCcw, Plus, Loader2, HardDriveDownload, Trash2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { buildUserSnapshot, restoreSnapshot } from '@/lib/backupUtils';

const MAX_BACKUPS = 30;

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const list = await api.entities.Backup.list('-created_date', 100);
    setBackups(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateNow = async () => {
    setCreating(true);
    try {
      const user = await api.auth.me();
      const { data, total } = await buildUserSnapshot();
      if (total === 0) {
        alert('Não há dados para backapear ainda.');
        setCreating(false);
        return;
      }
      const today = new Date().toISOString().slice(0, 10);

      // O snapshot é grande demais para um campo de entidade, então enviamos como arquivo
      const file = new File([JSON.stringify(data)], `backup-${today}.json`, { type: 'application/json' });
      const { file_url } = await api.integrations.Core.UploadFile({ file });

      await api.entities.Backup.create({
        backup_date: today,
        user_id: user.id,
        file_url,
        record_count: total,
      });

      // limpa backups antigos além do limite
      const fresh = await api.entities.Backup.list('-created_date', 100);
      for (let i = MAX_BACKUPS; i < fresh.length; i++) {
        await api.entities.Backup.delete(fresh[i].id);
      }
      await load();
    } catch (err) {
      console.error(err);
      alert('Não foi possível criar o backup: ' + (err?.message || 'erro desconhecido'));
    }
    setCreating(false);
  };

  const fetchSnapshot = async (backup) => {
    const res = await fetch(backup.file_url);
    return await res.json();
  };

  const handleDownload = async (backup) => {
    try {
      const snap = await fetchSnapshot(backup);
      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-solo-contest-${backup.backup_date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Não foi possível baixar o backup.');
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      const snap = await fetchSnapshot(restoreTarget);
      await restoreSnapshot(snap);
      setRestoreTarget(null);
      await load();
    } catch (err) {
      console.error(err);
      alert('Não foi possível restaurar o backup: ' + (err?.message || 'erro desconhecido'));
    }
    setRestoring(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.entities.Backup.delete(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      console.error(err);
    }
    setDeleting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Backups</h1>
          <p className="text-sm text-muted-foreground mt-1">Snapshots dos seus dados de estudo</p>
        </div>
        <Button onClick={handleCreateNow} disabled={creating} className="bg-blue-600 hover:bg-blue-700">
          {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...</> : <><Plus className="w-4 h-4 mr-2" /> Backup agora</>}
        </Button>
      </div>

      <GlassCard className="border-blue-500/20 bg-blue-500/5">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            Clique em "Backup agora" para salvar uma cópia completa dos seus planos, matérias, assuntos, sessões, revisões, questões e materiais. Mantemos os últimos {MAX_BACKUPS} snapshots. Cada backup é isolado por usuário — ninguém acessa os backups de outra conta. Dica: faça um backup antes de excluir qualquer matéria ou plano.
          </div>
        </div>
      </GlassCard>

      {backups.length === 0 ? (
        <GlassCard className="text-center py-12">
          <HardDriveDownload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">Nenhum backup ainda</p>
          <p className="text-sm text-muted-foreground mt-1">Clique em "Backup agora" para gerar o primeiro snapshot dos seus dados</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {backups.map(b => (
            <GlassCard key={b.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{moment(b.backup_date).format('DD/MM/YYYY')}</p>
                  <p className="text-xs text-muted-foreground">{b.record_count || 0} registros · criado {moment(b.created_date).format('DD/MM/YYYY HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleDownload(b)}>
                  <Download className="w-4 h-4 mr-1" /> Baixar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRestoreTarget(b)} className="border-border/50">
                  <RotateCcw className="w-4 h-4 mr-1" /> Restaurar
                </Button>
                <button
                  onClick={() => setDeleteTarget(b)}
                  className="p-2 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
                  title="Excluir backup"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <AlertDialog open={!!restoreTarget} onOpenChange={() => !restoring && setRestoreTarget(null)}>
        <AlertDialogContent className="bg-card border-border/50 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar backup de {restoreTarget ? moment(restoreTarget.backup_date).format('DD/MM/YYYY') : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              Os registros deste snapshot (planos, matérias, assuntos, sessões, revisões, questões e materiais) serão recriados e adicionados aos seus dados atuais. Use esta opção apenas se perdeu dados — se já houver dados atuais, poderá ocorrer duplicação. Esta ação não exclui seus dados existentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRestore(); }}
              disabled={restoring}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {restoring ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restaurando...</> : 'Restaurar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border/50 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir backup?</AlertDialogTitle>
            <AlertDialogDescription>Este snapshot será removido permanentemente. Seus dados atuais não são afetados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
