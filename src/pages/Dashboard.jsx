import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Link } from 'react-router-dom';
import moment from 'moment';
import {
  Clock, Target, BookOpen, RotateCcw, AlertTriangle,
  TrendingUp, Flame, CheckCircle2, ArrowRight, Brain
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatBox from '@/components/ui/StatBox';
import NeonProgress from '@/components/ui/NeonProgress';
import { getRecommendation, calculateMasteryIndex, getMasteryLabel, formatStudyTime } from '@/lib/studyUtils';
import PullToRefresh from '@/components/ui/PullToRefresh';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState(null);
  const [plans, setPlans] = useState([]);
  const [reviewLogs, setReviewLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    try {
      const [u, se, re, q, t, st, p, rl] = await Promise.all([
        api.auth.me(),
        api.entities.StudySession.list('-created_date', 200),
        api.entities.Review.list('-created_date', 200),
        api.entities.QuestionLog.list('-created_date', 200),
        api.entities.Topic.list('-created_date', 200),
        api.entities.UserStats.list('-created_date', 1),
        api.entities.StudyPlan.list('-created_date', 50),
        api.entities.ReviewLog.list('-created_date', 500),
      ]);
      setUser(u);
      setSessions(se);
      setReviews(re);
      setQuestions(q);
      setTopics(t);
      setStats(st[0] || null);
      setPlans(p);
      setReviewLogs(rl);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const today = moment().format('YYYY-MM-DD');
  const weekStart = moment().startOf('isoWeek').format('YYYY-MM-DD');

  const todaySessions = sessions.filter(s => s.date === today);
  const weekSessions = sessions.filter(s => s.date >= weekStart);
  const reviewToday = reviewLogs.filter(r => r.date === today).reduce((a, r) => a + (r.duration_minutes || 0), 0);
  const reviewWeek = reviewLogs.filter(r => r.date >= weekStart).reduce((a, r) => a + (r.duration_minutes || 0), 0);
  const reviewAll = reviewLogs.reduce((a, r) => a + (r.duration_minutes || 0), 0);
  const hoursToday = formatStudyTime(todaySessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) + reviewToday);
  const hoursWeek = formatStudyTime(weekSessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) + reviewWeek);

  const totalQuestions = questions.reduce((a, q) => a + (q.total_questions || 0), 0);
  const totalCorrect = questions.reduce((a, q) => a + (q.correct_answers || 0), 0);
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const pendingReviews = reviews.filter(r => !r.completed && r.due_date <= today);
  const todayReviews = reviews.filter(r => !r.completed && r.due_date === today);

  const recommendation = getRecommendation(topics, reviews, sessions);
  const streak = stats?.current_streak || 0;
  const totalHours = formatStudyTime(sessions.reduce((a, s) => a + (s.duration_minutes || 0), 0) + reviewAll);

  const overallProgress = topics.length > 0
    ? Math.round(topics.reduce((a, t) => a + calculateMasteryIndex(t), 0) / topics.length)
    : 0;

  const weakTopics = topics
    .map(t => ({ ...t, mastery: calculateMasteryIndex(t) }))
    .filter(t => t.mastery < 50)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  const greeting = () => {
    const h = moment().hour();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <PullToRefresh onRefresh={reload}>
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            {greeting()}, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{user?.full_name?.split(' ')[0] || 'Guerreiro'}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Continue evoluindo. Cada sessão te aproxima da aprovação.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2.5 rounded-xl glass-card px-3 py-2">
            <Flame className="w-4 h-4 text-red-400" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Sequência</p>
              <p className="text-sm font-display font-bold mt-0.5">{streak} dia(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl glass-card px-3 py-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Total estudado</p>
              <p className="text-sm font-display font-bold mt-0.5">{totalHours}</p>
            </div>
          </div>
        </div>
      </div>

      {recommendation && (
        <GlassCard className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/15">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Recomendação Inteligente</p>
              <p className="font-semibold text-lg">Estude agora: {recommendation.topic_name}</p>
              {recommendation.subject_name && <p className="text-sm text-muted-foreground">{recommendation.subject_name}</p>}
              <p className="text-sm text-muted-foreground mt-1">{recommendation.reason}</p>
            </div>
            <Link to={recommendation.type === 'review' ? '/reviews' : '/subjects'} className="shrink-0 p-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 transition-colors">
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </Link>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatBox icon={Clock} label="Tempo hoje" value={hoursToday} color="blue" />
        <StatBox icon={Clock} label="Tempo na semana" value={hoursWeek} color="purple" />
        <StatBox icon={Target} label="Questões feitas" value={totalQuestions} color="green" />
        <StatBox icon={CheckCircle2} label="Taxa de acertos" value={`${avgAccuracy}%`} color="yellow" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Link to="/plans">
          <GlassCard hover className="h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/15">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Estudar agora</p>
                <p className="text-xs text-muted-foreground">{plans.filter(p => p.is_active).length} plano(s) ativo(s)</p>
              </div>
            </div>
          </GlassCard>
        </Link>
        <Link to="/reviews">
          <GlassCard hover className="h-full">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${pendingReviews.length > 0 ? 'bg-red-500/15' : 'bg-emerald-500/15'}`}>
                <RotateCcw className={`w-5 h-5 ${pendingReviews.length > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
              </div>
              <div>
                <p className="font-semibold text-sm">Revisões pendentes</p>
                <p className="text-xs text-muted-foreground">{pendingReviews.length} revisão(ões)</p>
              </div>
            </div>
          </GlassCard>
        </Link>
        <Link to="/subjects">
          <GlassCard hover className="h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/15">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Pontos fracos</p>
                <p className="text-xs text-muted-foreground">{weakTopics.length} assunto(s)</p>
              </div>
            </div>
          </GlassCard>
        </Link>
        <Link to="/stats">
          <GlassCard hover className="h-full">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/15">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Evolução</p>
                <p className="text-xs text-muted-foreground">Ver estatísticas</p>
              </div>
            </div>
          </GlassCard>
        </Link>
      </div>

      {overallProgress > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Progresso Geral</p>
            <p className="text-sm font-display text-blue-400">{overallProgress}%</p>
          </div>
          <NeonProgress value={overallProgress} max={100} color="blue" size="lg" />
        </GlassCard>
      )}

      {weakTopics.length > 0 && (
        <GlassCard>
          <p className="text-sm font-semibold mb-4">Assuntos que precisam de atenção</p>
          <div className="space-y-3">
            {weakTopics.map(t => {
              const m = getMasteryLabel(t.mastery);
              return (
                <div key={t.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className={`text-xs ${m.color}`}>{m.label}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <NeonProgress value={t.mastery} max={100} color={t.mastery < 40 ? 'red' : 'yellow'} size="sm" className="w-24" />
                    <span className="text-xs font-display text-muted-foreground w-8 text-right">{t.mastery}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
    </PullToRefresh>
  );
}
