import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/api/client';
import { SELECT_CLASS } from './fmt';

// Registro do tempo de revisão. Matéria e assunto são opcionais (usam os já cadastrados).
export default function ReviewTimeCard({ defaultDate, subjects, topics, onLogged }) {
  const [date, setDate] = useState(defaultDate);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [minutes, setMinutes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subjectTopics = topics.filter((t) => t.subject_id === subjectId);

  const handleAdd = async (e) => {
    e?.preventDefault();
    const mins = Number(minutes);
    if (!mins || mins <= 0 || !date) return;
    setSubmitting(true);
    setError('');
    try {
      const subject = subjects.find((s) => s.id === subjectId);
      const topic = topics.find((t) => t.id === topicId);
      await api.entities.ReviewLog.create({
        date,
        duration_minutes: mins,
        ...(subject ? { subject_id: subject.id, subject_name: subject.name, plan_id: subject.plan_id } : {}),
        ...(topic ? { topic_id: topic.id, topic_name: topic.name } : {}),
      });
      setMinutes('');
      onLogged?.();
    } catch (err) {
      console.error(err);
      setError('Não foi possível registrar. Tente novamente.');
    }
    setSubmitting(false);
  };

  return (
    <GlassCard>
      <p className="text-sm font-semibold mb-1">Registrar tempo de revisão</p>
      <p className="text-[11px] text-muted-foreground mb-4">Escolha a matéria e o assunto para ver o tempo de revisão de cada um.</p>
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Minutos</Label>
          <Input type="number" min="1" inputMode="numeric" placeholder="Minutos" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Matéria <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setTopicId(''); }} className={SELECT_CLASS}>
            <option value="">Não informar</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Assunto <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={!subjectId || subjectTopics.length === 0} className={SELECT_CLASS}>
            <option value="">{subjectId && subjectTopics.length === 0 ? 'Sem assuntos cadastrados' : 'Não informar'}</option>
            {subjectTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="submit" disabled={submitting || !minutes} className="gap-2">
            <Plus className="w-4 h-4" /> Registrar revisão
          </Button>
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </form>
    </GlassCard>
  );
}
