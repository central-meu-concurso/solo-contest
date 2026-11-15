import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import moment from 'moment';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';



export default function StudySessionModal({ plan, subjects, allTopics, suggestedSubjectId, onClose, onComplete }) {
  const [subjectId, setSubjectId] = useState(suggestedSubjectId || subjects[0]?.id || '');
  const [topicId, setTopicId] = useState('');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedSubject = subjects.find(s => s.id === subjectId);
  const modalTopics = allTopics.filter(t => t.subject_id === subjectId);

  useEffect(() => {
    setTopicId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const handleSave = async () => {
    if (!subjectId || duration <= 0) return;
    setSaving(true);
    setError('');
    const selectedTopic = topicId ? allTopics.find(t => t.id === topicId) : null;
    const today = moment().format('YYYY-MM-DD');

    try {
    await api.entities.StudySession.create({
      plan_id: plan.id,
      subject_id: subjectId,
      topic_id: topicId || undefined,
      subject_name: selectedSubject?.name || '',
      topic_name: selectedTopic?.name || '',
      date: today,
      start_time: moment().format('HH:mm'),
      duration_minutes: duration,
      notes,
    });

    if (selectedTopic) {
      await api.entities.Topic.update(topicId, {
        total_study_minutes: (selectedTopic.total_study_minutes || 0) + duration,
        last_studied: moment().toISOString(),
        study_count: (selectedTopic.study_count || 0) + 1,
      });
    }

    // Generate reviews
    let stats = await api.entities.UserStats.list('-created_date', 1);
    let userStats = stats[0];
    const intervals = userStats?.review_intervals || [1, 7, 15, 30];

    const isFirstStudy = selectedTopic && (selectedTopic.study_count || 0) === 0;
    if (isFirstStudy) {
      for (let i = 0; i < intervals.length; i++) {
        await api.entities.Review.create({
          plan_id: plan.id,
          subject_id: subjectId,
          topic_id: topicId,
          subject_name: selectedSubject?.name || '',
          topic_name: selectedTopic?.name || '',
          due_date: moment().add(intervals[i], 'days').format('YYYY-MM-DD'),
          review_number: i + 1,
          completed: false,
        });
      }
    }

    // Advance cycle
    const sortedSubjects = [...subjects].sort((a, b) => (a.cycle_order || 0) - (b.cycle_order || 0));
    if (sortedSubjects.length > 0) {
      const nextIndex = ((plan.current_cycle_index || 0) + 1) % sortedSubjects.length;
      await api.entities.StudyPlan.update(plan.id, { current_cycle_index: nextIndex });
    }

    // Update streak
    if (!userStats) {
      await api.entities.UserStats.create({
        current_streak: 1,
        longest_streak: 1,
        last_study_date: today,
        review_intervals: [1, 7, 15, 30],
      });
    } else {
      const lastDate = userStats.last_study_date;
      let newStreak = userStats.current_streak || 0;
      if (lastDate === today) {
        // same day
      } else if (lastDate === moment().subtract(1, 'day').format('YYYY-MM-DD')) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      await api.entities.UserStats.update(userStats.id, {
        current_streak: newStreak,
        longest_streak: Math.max(userStats.longest_streak || 0, newStreak),
        last_study_date: today,
      });
    }

    setSaving(false);
    onClose();
    onComplete();
    } catch (e) {
      console.error(e);
      setError('Erro ao registrar. Tente novamente.');
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border/50 text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" /> Registrar Estudo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Matéria *</Label>
            <select
              value={subjectId}
              onChange={e => setSubjectId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.id === suggestedSubjectId ? ' (sugerido)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Assunto estudado <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            {modalTopics.length > 0 ? (
              <select
                value={topicId || 'none'}
                onChange={e => setTopicId(e.target.value === 'none' ? '' : e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="none">Sem assunto específico</option>
                {modalTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground py-2">Nenhum assunto cadastrado — você pode registrar apenas as horas.</p>
            )}
          </div>
          <div>
            <Label>Tempo estudado (minutos) *</Label>
            <Input type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))} className="bg-muted/50 border-border/50" />
          </div>
          <div>
            <Label>Anotações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="O que você estudou..." className="bg-muted/50 border-border/50" />
          </div>
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button onClick={handleSave} disabled={saving || !subjectId} className="w-full bg-blue-600 hover:bg-blue-700">
            {saving ? 'Salvando...' : 'Registrar Sessão'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
