import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import moment from 'moment';
import { RotateCcw, CheckCircle2, AlertTriangle, Clock, Calendar } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const r = await api.entities.Review.list('-created_date', 500);
    setReviews(r);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const completeReview = async (review) => {
    const today = moment().format('YYYY-MM-DD');
    // atualização otimista
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, completed: true, completed_date: today } : r));
    try {
      await api.entities.Review.update(review.id, { completed: true, completed_date: today });
    } catch (e) {
      // reverte em caso de erro
      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, completed: false, completed_date: undefined } : r));
      console.error(e);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  }

  const today = moment().format('YYYY-MM-DD');
  const overdue = reviews.filter(r => !r.completed && r.due_date < today).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const todayReviews = reviews.filter(r => !r.completed && r.due_date === today);
  const upcoming = reviews.filter(r => !r.completed && r.due_date > today).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const completed = reviews.filter(r => r.completed).sort((a, b) => (b.completed_date || '').localeCompare(a.completed_date || ''));

  const ReviewCard = ({ review, isOverdue }) => (
    <GlassCard className={`${isOverdue ? 'border-red-500/20' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
            <p className="font-semibold text-sm break-words">{review.topic_name}</p>
          </div>
          <p className="text-xs text-muted-foreground">{review.subject_name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {moment(review.due_date).format('DD/MM/YYYY')}</span>
            <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> {review.review_number}ª revisão</span>
          </div>
          {isOverdue && (
            <p className="text-xs text-red-400 mt-1">Atrasada há {moment().diff(moment(review.due_date), 'days')} dia(s)</p>
          )}
        </div>
        {!review.completed && (
          <Button onClick={() => completeReview(review)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Concluir
          </Button>
        )}
      </div>
    </GlassCard>
  );

  return (
    <PullToRefresh onRefresh={load}>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Revisões</h1>
        <p className="text-sm text-muted-foreground mt-1">Sistema de repetição espaçada inteligente</p>
      </div>

      {overdue.length > 0 && (
        <GlassCard className="border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <p className="text-sm font-semibold text-red-400">{overdue.length} revisão(ões) atrasada(s)</p>
          </div>
          <p className="text-xs text-muted-foreground">Complete suas revisões para manter o conhecimento fresco</p>
        </GlassCard>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-muted/30 border border-border/30 w-full grid grid-cols-3 h-auto">
          <TabsTrigger value="pending" className="px-1 sm:px-3 text-xs sm:text-sm min-w-0 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            Pendentes ({overdue.length + todayReviews.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="px-1 sm:px-3 text-xs sm:text-sm min-w-0 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            Próximas ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="done" className="px-1 sm:px-3 text-xs sm:text-sm min-w-0 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            Concluídas ({completed.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {overdue.length === 0 && todayReviews.length === 0 ? (
            <GlassCard className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
              <p className="text-sm font-semibold">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">Nenhuma revisão pendente</p>
            </GlassCard>
          ) : (
            <>
              {overdue.map(r => <ReviewCard key={r.id} review={r} isOverdue />)}
              {todayReviews.map(r => <ReviewCard key={r.id} review={r} isOverdue={false} />)}
            </>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-3 mt-4">
          {upcoming.length === 0 ? (
            <GlassCard className="text-center py-8">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma revisão agendada</p>
            </GlassCard>
          ) : (
            upcoming.slice(0, 20).map(r => <ReviewCard key={r.id} review={r} isOverdue={false} />)
          )}
        </TabsContent>

        <TabsContent value="done" className="space-y-3 mt-4">
          {completed.length === 0 ? (
            <GlassCard className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhuma revisão concluída ainda</p>
            </GlassCard>
          ) : (
            completed.slice(0, 20).map(r => (
              <GlassCard key={r.id}>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium break-words">{r.topic_name}</p>
                    <p className="text-xs text-muted-foreground">{r.subject_name} · {r.review_number}ª revisão · {moment(r.completed_date).format('DD/MM/YYYY')}</p>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
    </PullToRefresh>
  );
}
