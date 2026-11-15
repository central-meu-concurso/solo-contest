import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/client';
import { useParams, Link } from 'react-router-dom';
import {
  Plus, ArrowLeft, Play, ChevronDown, ChevronRight,
  Trash2, BookOpen
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonProgress from '@/components/ui/NeonProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { calculateMasteryIndex, getMasteryLabel, deleteSubjectCascade } from '@/lib/studyUtils';
import StudySessionModal from '@/components/study/StudySessionModal';
import DangerConfirmDialog from '@/components/ui/DangerConfirmDialog';

export default function PlanDetail() {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [showStudy, setShowStudy] = useState(false);
  const [studyInitialSubject, setStudyInitialSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({ name: '', priority: 'Média', weight: 1, weekly_hours: 2 });
  const [topicForm, setTopicForm] = useState({ name: '' });
  const [deleteSubjectTarget, setDeleteSubjectTarget] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(false);
  const [deleteTopicTarget, setDeleteTopicTarget] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(false);

  const load = useCallback(async () => {
    const [p, s, t] = await Promise.all([
      api.entities.StudyPlan.get(planId),
      api.entities.Subject.filter({ plan_id: planId }),
      api.entities.Topic.filter({ plan_id: planId }),
    ]);
    setPlan(p);
    setSubjects(s.sort((a, b) => (a.cycle_order || 0) - (b.cycle_order || 0)));
    setTopics(t);
    setLoading(false);
  }, [planId]);

  useEffect(() => { load(); }, [load]);

  const addSubject = async () => {
    if (!subjectForm.name.trim()) return;
    await api.entities.Subject.create({ ...subjectForm, plan_id: planId, cycle_order: subjects.length });
    setSubjectForm({ name: '', priority: 'Média', weight: 1, weekly_hours: 2 });
    setShowAddSubject(false);
    load();
  };

  const addTopic = async () => {
    if (!topicForm.name.trim() || !showAddTopic) return;
    await api.entities.Topic.create({ name: topicForm.name, subject_id: showAddTopic, plan_id: planId });
    setTopicForm({ name: '' });
    setShowAddTopic(null);
    load();
  };

  const deleteSubject = async () => {
    if (!deleteSubjectTarget) return;
    setDeletingSubject(true);
    try {
      await deleteSubjectCascade(deleteSubjectTarget.id, topics);
      setDeleteSubjectTarget(null);
      load();
    } finally {
      setDeletingSubject(false);
    }
  };

  const deleteTopic = async () => {
    if (!deleteTopicTarget) return;
    setDeletingTopic(true);
    try {
      await api.entities.Topic.delete(deleteTopicTarget.id);
      setDeleteTopicTarget(null);
      load();
    } finally {
      setDeletingTopic(false);
    }
  };

  const currentSubject = subjects.length > 0 ? subjects[(plan?.current_cycle_index || 0) % subjects.length] : null;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  if (!plan) {
    return <div className="text-center py-12 text-muted-foreground">Plano não encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/plans" className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">{plan.name}</h1>
          {plan.objective && <p className="text-sm text-muted-foreground">{plan.objective}</p>}
        </div>
      </div>

      {currentSubject && (
        <GlassCard className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Sugestão do ciclo</p>
              <p className="text-lg font-semibold">{currentSubject.name}</p>
              <p className="text-xs text-muted-foreground">
                Posição {((plan.current_cycle_index || 0) % subjects.length) + 1} de {subjects.length}
              </p>
            </div>
            <Button onClick={() => { setStudyInitialSubject(null); setShowStudy(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" /> Estudar
            </Button>
          </div>
          <div className="flex gap-1 mt-4">
            {subjects.map((s, i) => (
              <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-colors ${i === (plan.current_cycle_index || 0) % subjects.length ? 'bg-blue-500 progress-glow-blue' : i < (plan.current_cycle_index || 0) % subjects.length ? 'bg-blue-500/30' : 'bg-muted/50'}`} />
            ))}
          </div>
        </GlassCard>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-semibold">Matérias ({subjects.length})</h2>
        <Button onClick={() => setShowAddSubject(true)} variant="outline" size="sm" className="border-border/50">
          <Plus className="w-4 h-4 mr-1" /> Matéria
        </Button>
      </div>

      {subjects.length === 0 ? (
        <GlassCard className="text-center py-8">
          <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Adicione matérias para montar seu ciclo de estudos</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject, index) => {
            const subTopics = topics.filter(t => t.subject_id === subject.id);
            const isExpanded = expandedSubject === subject.id;
            const priorityColors = { 'Alta': 'text-red-400 bg-red-500/15', 'Média': 'text-yellow-400 bg-yellow-500/15', 'Baixa': 'text-emerald-400 bg-emerald-500/15' };
            const isNext = index === (plan.current_cycle_index || 0) % subjects.length;

            return (
              <GlassCard key={subject.id} className={isNext ? 'border-blue-500/30' : ''}>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <span className="text-xs font-display">{index + 1}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{subject.name}</span>
                      {isNext && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Próximo</span>}
                    </div>
                    <div className="flex gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityColors[subject.priority]}`}>{subject.priority}</span>
                      <span className="text-[10px] text-muted-foreground">{subTopics.length} assunto(s)</span>
                      <span className="text-[10px] text-muted-foreground">Peso: {subject.weight}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setStudyInitialSubject(subject.id); setShowStudy(true); }} className="p-1.5 rounded hover:bg-blue-500/15 text-muted-foreground hover:text-blue-400 transition-colors" title="Estudar">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteSubjectTarget(subject); }} className="p-1.5 rounded hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pl-8 space-y-2">
                    {subTopics.map(topic => {
                      const mastery = calculateMasteryIndex(topic);
                      const m = getMasteryLabel(mastery);
                      return (
                        <div key={topic.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
                          <div>
                            <p className="text-sm">{topic.name}</p>
                            <p className={`text-xs ${m.color}`}>{m.label} — {mastery}/100</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <NeonProgress value={mastery} max={100} color={mastery >= 71 ? 'blue' : mastery >= 41 ? 'yellow' : 'red'} size="sm" className="w-16" />
                            <button onClick={() => setDeleteTopicTarget(topic)} className="p-1 rounded hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => setShowAddTopic(subject.id)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 py-1">
                      <Plus className="w-3 h-3" /> Adicionar assunto
                    </button>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent className="bg-card border-border/50 text-foreground">
          <DialogHeader><DialogTitle className="font-display">Adicionar Matéria</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} placeholder="Ex: Português" className="bg-muted/50 border-border/50" />
            </div>
            <div>
              <Label>Prioridade</Label>
              <select
                value={subjectForm.priority}
                onChange={e => setSubjectForm({...subjectForm, priority: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Peso</Label>
                <Input type="number" min={1} value={subjectForm.weight} onChange={e => setSubjectForm({...subjectForm, weight: Number(e.target.value)})} className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <Label>Horas/semana</Label>
                <Input type="number" min={0.5} step={0.5} value={subjectForm.weekly_hours} onChange={e => setSubjectForm({...subjectForm, weekly_hours: Number(e.target.value)})} className="bg-muted/50 border-border/50" />
              </div>
            </div>
            <Button onClick={addSubject} className="w-full bg-blue-600 hover:bg-blue-700">Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddTopic} onOpenChange={() => setShowAddTopic(null)}>
        <DialogContent className="bg-card border-border/50 text-foreground">
          <DialogHeader><DialogTitle className="font-display">Adicionar Assunto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do assunto *</Label>
              <Input value={topicForm.name} onChange={e => setTopicForm({ name: e.target.value })} placeholder="Ex: Crase" className="bg-muted/50 border-border/50" />
            </div>
            <Button onClick={addTopic} className="w-full bg-blue-600 hover:bg-blue-700">Adicionar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {showStudy && (
        <StudySessionModal
          plan={plan}
          subjects={subjects}
          allTopics={topics}
          suggestedSubjectId={studyInitialSubject || currentSubject?.id}
          onClose={() => setShowStudy(false)}
          onComplete={load}
        />
      )}

      <DangerConfirmDialog
        open={!!deleteSubjectTarget}
        onOpenChange={(v) => !v && setDeleteSubjectTarget(null)}
        title="Excluir matéria?"
        description={`Isto removerá a matéria "${deleteSubjectTarget?.name}" e TODOS os seus assuntos, sessões, revisões e questões vinculadas. Esta ação NÃO PODE ser desfeita.`}
        itemName={deleteSubjectTarget?.name}
        onConfirm={deleteSubject}
        loading={deletingSubject}
      />

      <DangerConfirmDialog
        open={!!deleteTopicTarget}
        onOpenChange={(v) => !v && setDeleteTopicTarget(null)}
        title="Excluir assunto?"
        description={`Remover o assunto "${deleteTopicTarget?.name}". O histórico de estudos e questões deste assunto será perdido.`}
        onConfirm={deleteTopic}
        loading={deletingTopic}
      />
    </div>
  );
}
