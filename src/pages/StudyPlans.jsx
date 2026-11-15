import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { Plus, BookOpen, Calendar, Target, ArrowRight, Trash2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DangerConfirmDialog from '@/components/ui/DangerConfirmDialog';
import { deleteSubjectCascade } from '@/lib/studyUtils';

export default function StudyPlans() {
  const [plans, setPlans] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deletePlan, setDeletePlan] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', objective: '', start_date: moment().format('YYYY-MM-DD'), exam_date: '', notes: '' });

  const load = async () => {
    const [p, s] = await Promise.all([
      api.entities.StudyPlan.list('-created_date', 50),
      api.entities.Subject.list('-created_date', 200),
    ]);
    setPlans(p);
    setSubjects(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await api.entities.StudyPlan.create({ ...form, is_active: true, current_cycle_index: 0 });
    setForm({ name: '', objective: '', start_date: moment().format('YYYY-MM-DD'), exam_date: '', notes: '' });
    setShowCreate(false);
    load();
  };

  const handleDelete = async () => {
    if (!deletePlan) return;
    setDeleting(true);
    try {
      const planSubjects = subjects.filter(s => s.plan_id === deletePlan.id);
      const planTopics = await api.entities.Topic.filter({ plan_id: deletePlan.id });
      for (const s of planSubjects) {
        // apaga também assuntos, sessões, revisões e questões ligadas à matéria
        await deleteSubjectCascade(s.id, planTopics);
      }
      await api.entities.StudySession.deleteMany({ plan_id: deletePlan.id });
      await api.entities.Review.deleteMany({ plan_id: deletePlan.id });
      await api.entities.QuestionLog.deleteMany({ plan_id: deletePlan.id });
      await api.entities.StudyPlan.delete(deletePlan.id);
      setDeletePlan(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Planos de Estudo</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize seus ciclos de estudo</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <GlassCard className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">Nenhum plano criado</p>
          <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro plano de estudos para começar</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Criar Plano
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(plan => {
            const planSubjects = subjects.filter(s => s.plan_id === plan.id);
            const daysToExam = plan.exam_date ? moment(plan.exam_date).diff(moment(), 'days') : null;
            return (
              <GlassCard key={plan.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-500/15">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      {plan.objective && <p className="text-xs text-muted-foreground">{plan.objective}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setDeletePlan(plan); }} className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Início: {moment(plan.start_date).format('DD/MM/YYYY')}</span>
                  {daysToExam !== null && (
                    <span className={`flex items-center gap-1 ${daysToExam <= 30 ? 'text-yellow-400' : ''}`}>
                      <Target className="w-3 h-3" /> {daysToExam > 0 ? `${daysToExam} dias para a prova` : 'Prova passou'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">{planSubjects.length} matéria(s)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${plan.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <Link to={`/plans/${plan.id}`} className="flex items-center justify-center gap-2 mt-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium transition-colors">
                  Gerenciar <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display">Novo Plano de Estudos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do plano *</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ex: Concurso TRF" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <Label>Objetivo</Label>
              <Input value={form.objective} onChange={e => setForm({...form, objective: e.target.value})} placeholder="Ex: Aprovação no TRF" className="bg-muted/50 border-border/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data de início *</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <Label>Data da prova</Label>
                <Input type="date" value={form.exam_date} onChange={e => setForm({...form, exam_date: e.target.value})} className="bg-muted/50 border-border/50" />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Anotações sobre o plano..." className="bg-muted/50 border-border/50" />
            </div>
            <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">Criar Plano</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DangerConfirmDialog
        open={!!deletePlan}
        onOpenChange={(v) => !v && setDeletePlan(null)}
        title="Excluir plano?"
        description={`Isto removerá o plano "${deletePlan?.name}", ${subjects.filter(s => s.plan_id === deletePlan?.id).length} matéria(s) e TODOS os assuntos, sessões, revisões e questões vinculadas. Esta ação NÃO PODE ser desfeita.`}
        itemName={deletePlan?.name}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
