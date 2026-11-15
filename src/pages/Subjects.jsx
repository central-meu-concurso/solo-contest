import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Library, ChevronDown, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonProgress from '@/components/ui/NeonProgress';
import { calculateMasteryIndex, getMasteryLabel, deleteSubjectCascade } from '@/lib/studyUtils';
import { Trash2 } from 'lucide-react';
import DangerConfirmDialog from '@/components/ui/DangerConfirmDialog';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [plans, setPlans] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const [s, t, p] = await Promise.all([
      api.entities.Subject.list('-created_date', 200),
      api.entities.Topic.list('-created_date', 500),
      api.entities.StudyPlan.list('-created_date', 50),
    ]);
    setSubjects(s);
    setTopics(t);
    setPlans(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeleteSubject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubjectCascade(deleteTarget.id, topics);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const groupedByPlan = plans.map(plan => ({
    ...plan,
    subjects: subjects.filter(s => s.plan_id === plan.id),
  })).filter(p => p.subjects.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Matérias</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral de todas as matérias e assuntos</p>
      </div>

      {groupedByPlan.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Library className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">Nenhuma matéria encontrada</p>
          <p className="text-sm text-muted-foreground mt-1">Adicione matérias nos seus planos de estudo</p>
        </GlassCard>
      ) : (
        groupedByPlan.map(plan => (
          <div key={plan.id} className="space-y-3">
            <h2 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider">{plan.name}</h2>
            {plan.subjects.map(subject => {
              const subTopics = topics.filter(t => t.subject_id === subject.id);
              const isExpanded = expanded === subject.id;
              const avgMastery = subTopics.length > 0
                ? Math.round(subTopics.reduce((a, t) => a + calculateMasteryIndex(t), 0) / subTopics.length)
                : 0;

              return (
                <GlassCard key={subject.id}>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : subject.id)}>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{subject.name}</p>
                      <p className="text-xs text-muted-foreground">{subTopics.length} assunto(s) · Domínio médio: {avgMastery}%</p>
                    </div>
                    <NeonProgress value={avgMastery} max={100} color={avgMastery >= 71 ? 'blue' : avgMastery >= 41 ? 'yellow' : 'red'} size="sm" className="w-24" />
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(subject); }} className="p-1.5 rounded hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isExpanded && subTopics.length > 0 && (
                    <div className="mt-4 pl-7 space-y-2">
                      {subTopics.map(topic => {
                        const mastery = calculateMasteryIndex(topic);
                        const m = getMasteryLabel(mastery);
                        const accuracy = topic.total_questions > 0 ? Math.round((topic.total_correct / topic.total_questions) * 100) : null;
                        return (
                          <div key={topic.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/20">
                            <div>
                              <p className="text-sm font-medium">{topic.name}</p>
                              <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                                <span className={m.color}>{m.label}</span>
                                {accuracy !== null && <span>Acerto: {accuracy}%</span>}
                                <span>{topic.total_study_minutes || 0} min estudados</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <NeonProgress value={mastery} max={100} color={mastery >= 71 ? 'blue' : mastery >= 41 ? 'yellow' : 'red'} size="sm" className="w-16" />
                              <span className="text-xs font-display text-muted-foreground w-8 text-right">{mastery}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        ))
      )}

      <DangerConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Excluir matéria?"
        description={`Isto removerá a matéria "${deleteTarget?.name}" e TODOS os seus assuntos, sessões, revisões e questões vinculadas. Esta ação NÃO PODE ser desfeita.`}
        itemName={deleteTarget?.name}
        onConfirm={handleDeleteSubject}
        loading={deleting}
      />
    </div>
  );
}
