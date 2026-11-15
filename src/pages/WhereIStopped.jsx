import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import moment from 'moment';
import { Bookmark, Plus, ImageOff, Trash2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import MaterialFormDialog from '@/components/study/MaterialFormDialog';
import MaterialDetailDialog from '@/components/study/MaterialDetailDialog';

export default function WhereIStopped() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    const [m, s] = await Promise.all([
      api.entities.StudyMaterial.list('-last_updated', 500),
      api.entities.Subject.list('-created_date', 200),
    ]);
    const sorted = [...m].sort((a, b) => moment(b.last_updated || 0).valueOf() - moment(a.last_updated || 0).valueOf());
    setMaterials(sorted);
    setSubjects(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.entities.StudyMaterial.delete(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Onde Parei</h1>
          <p className="text-sm text-muted-foreground mt-1">Marcadores de progresso dos seus materiais</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Material
        </Button>
      </div>

      {materials.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">Nenhum material registrado</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione um material para marcar onde você parou nos estudos</p>
          <Button onClick={() => setShowAdd(true)} className="mt-4 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Material
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(m => (
            <GlassCard key={m.id} hover onClick={() => setSelected(m)} className="flex flex-col">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted/30 mb-3 flex items-center justify-center">
                {m.image_url ? (
                  <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{m.name}</p>
                  {m.subject_name && <p className="text-xs text-muted-foreground truncate">{m.subject_name}</p>}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }}
                  className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">Pág. {m.current_page || 1}</span>
                <span>{m.last_updated ? moment(m.last_updated).format('DD/MM/YYYY') : '—'}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showAdd && (
        <MaterialFormDialog subjects={subjects} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      )}

      {selected && (
        <MaterialDetailDialog material={selected} onClose={() => setSelected(null)} onUpdated={() => load()} />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border/50 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>Esse marcador de progresso será removido permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
