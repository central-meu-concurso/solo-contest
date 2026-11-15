import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import moment from 'moment';
import { HelpCircle, Plus } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import NeonProgress from '@/components/ui/NeonProgress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Questions() {
  const [logs, setLogs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [form, setForm] = useState({ topic_id: '', total_questions: '', correct_answers: '' });

  const load = async () => {
    const [l, s, t] = await Promise.all([
      api.entities.QuestionLog.list('-created_date', 500),
      api.entities.Subject.list('-created_date', 200),
      api.entities.Topic.list('-created_date', 500),
    ]);
    setLogs(l);
    setSubjects(s);
    setTopics(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const total = Number(form.total_questions);
    const correct = Number(form.correct_answers);
    if (!form.topic_id || total <= 0 || correct < 0 || correct > total) return;

    const topic = topics.find(t => t.id === form.topic_id);
    const subject = subjects.find(s => s.id === topic?.subject_id);

    await api.entities.QuestionLog.create({
      plan_id: topic?.plan_id,
      subject_id: topic?.subject_id,
      topic_id: form.topic_id,
      subject_name: subject?.name || '',
      topic_name: topic?.name || '',
      date: moment().format('YYYY-MM-DD'),
      total_questions: total,
      correct_answers: correct,
      wrong_answers: total - correct,
    });

    await api.entities.Topic.update(form.topic_id, {
      total_questions: (topic?.total_questions || 0) + total,
      total_correct: (topic?.total_correct || 0) + correct,
    });

    setForm({ topic_id: '', total_questions: '', correct_answers: '' });
    setSelectedSubject('');
    setShowAdd(false);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  // Aggregate by topic
  const topicStats = {};
  logs.forEach(l => {
    if (!topicStats[l.topic_id]) {
      topicStats[l.topic_id] = { topic_name: l.topic_name, subject_name: l.subject_name, total: 0, correct: 0 };
    }
    topicStats[l.topic_id].total += l.total_questions || 0;
    topicStats[l.topic_id].correct += l.correct_answers || 0;
  });

  const filteredTopics = selectedSubject ? topics.filter(t => t.subject_id === selectedSubject) : topics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Questões</h1>
          <p className="text-sm text-muted-foreground mt-1">Registre e acompanhe seu desempenho</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Registrar
        </Button>
      </div>

      {Object.keys(topicStats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(topicStats).sort((a, b) => b[1].total - a[1].total).map(([id, s]) => {
            const accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
            return (
              <GlassCard key={id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{s.topic_name}</p>
                    <p className="text-xs text-muted-foreground">{s.subject_name}</p>
                  </div>
                  <span className={`text-lg font-display font-bold ${accuracy >= 70 ? 'text-emerald-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{accuracy}%</span>
                </div>
                <NeonProgress value={accuracy} max={100} color={accuracy >= 70 ? 'green' : accuracy >= 50 ? 'yellow' : 'red'} size="sm" />
                <p className="text-xs text-muted-foreground mt-2">
                  Você fez {s.total} questões e acertou {accuracy}% ({s.correct}/{s.total})
                </p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {logs.length === 0 && (
        <GlassCard className="text-center py-12">
          <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">Nenhuma questão registrada</p>
          <p className="text-sm text-muted-foreground mt-1">Comece registrando questões para acompanhar sua evolução</p>
        </GlassCard>
      )}

      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-display font-semibold mb-3">Histórico recente</h2>
          <div className="space-y-2">
            {logs.slice(0, 15).map(l => {
              const accuracy = l.total_questions > 0 ? Math.round((l.correct_answers / l.total_questions) * 100) : 0;
              return (
                <GlassCard key={l.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{l.topic_name}</p>
                      <p className="text-xs text-muted-foreground">{l.subject_name} · {moment(l.date).format('DD/MM/YYYY')}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-display font-bold ${accuracy >= 70 ? 'text-emerald-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{accuracy}%</p>
                      <p className="text-xs text-muted-foreground">{l.correct_answers}/{l.total_questions}</p>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border/50 text-foreground">
          <DialogHeader><DialogTitle className="font-display">Registrar Questões</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Matéria</Label>
              <select
                value={selectedSubject}
                onChange={e => { setSelectedSubject(e.target.value); setForm({...form, topic_id: ''}); }}
                className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Filtrar por matéria</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Assunto *</Label>
              <select
                value={form.topic_id}
                onChange={e => setForm({...form, topic_id: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Selecione o assunto</option>
                {filteredTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Total de questões *</Label>
                <Input type="number" min={1} value={form.total_questions} onChange={e => setForm({...form, total_questions: e.target.value})} className="bg-muted/50 border-border/50" />
              </div>
              <div>
                <Label>Acertos *</Label>
                <Input type="number" min={0} value={form.correct_answers} onChange={e => setForm({...form, correct_answers: e.target.value})} className="bg-muted/50 border-border/50" />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700">Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
