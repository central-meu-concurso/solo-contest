import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/api/client';
import moment from 'moment';
import StatsTabs from '@/components/statistics/StatsTabs';
import StatsCalendar from '@/components/statistics/StatsCalendar';
import OverviewKpis from '@/components/statistics/OverviewKpis';
import SubjectStats from '@/components/statistics/SubjectStats';
import DayHistoryCard from '@/components/statistics/DayHistoryCard';
import StatsCharts from '@/components/statistics/StatsCharts';
import ReviewStats from '@/components/statistics/ReviewStats';
import ReviewTimeCard from '@/components/statistics/ReviewTimeCard';
import { SELECT_CLASS } from '@/components/statistics/fmt';
import { aggregate, dayDetail, sumByDate, monthKey } from '@/lib/statsUtils';

const PALETTE = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#F97316', '#EC4899'];
const BIG = 10000;

const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'calendario', label: 'Calendário' },
  { id: 'graficos', label: 'Gráficos' },
  { id: 'revisoes', label: 'Revisões' },
];

export default function Statistics() {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [reviewLogs, setReviewLogs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('resumo');
  const [planScope, setPlanScope] = useState('active');
  const [chartFilter, setChartFilter] = useState('day');
  const today = moment().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(today);
  const [calMonth, setCalMonth] = useState(today.slice(0, 7));

  const reload = useCallback(async () => {
    try {
      const [se, s, t, rl, pl] = await Promise.all([
        api.entities.StudySession.list('-created_date', BIG),
        api.entities.Subject.list('-created_date', BIG),
        api.entities.Topic.list('-created_date', BIG),
        api.entities.ReviewLog.list('-created_date', BIG),
        api.entities.StudyPlan.list('-created_date', 200),
      ]);
      setSessions(se);
      const oldestFirst = (a, b) => String(a.created_date).localeCompare(String(b.created_date));
      setSubjects([...s].sort(oldestFirst));
      setTopics([...t].sort(oldestFirst));
      setReviewLogs(rl);
      setPlans(pl);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const selectDate = (d) => { setSelectedDate(d); setCalMonth(monthKey(d)); };

  // Escopo: plano ativo (padrão, como antes) ou todos os planos.
  const scoped = useMemo(() => {
    const activePlan = plans.find((p) => p.is_active) || plans[0] || null;
    if (planScope === 'all' || !activePlan) {
      return { activePlan, sessions, subjects, topics, reviewLogs };
    }
    const subs = subjects.filter((s) => s.plan_id === activePlan.id);
    const subIds = new Set(subs.map((s) => s.id));
    const allSubIds = new Set(subjects.map((s) => s.id));
    return {
      activePlan,
      sessions: sessions.filter((s) => s.plan_id === activePlan.id),
      subjects: subs,
      topics: topics.filter((t) => subIds.has(t.subject_id)),
      // revisões sem matéria (ou de matéria já apagada) continuam contando
      reviewLogs: reviewLogs.filter((r) => !r.subject_id || subIds.has(r.subject_id) || !allSubIds.has(r.subject_id)),
    };
  }, [plans, planScope, sessions, subjects, topics, reviewLogs]);

  const agg = useMemo(
    () => aggregate({ sessions: scoped.sessions, reviewLogs: scoped.reviewLogs, subjects: scoped.subjects, topics: scoped.topics, today }),
    [scoped, today]
  );

  const colorById = useMemo(() => {
    const m = {};
    scoped.subjects.forEach((s, i) => { m[s.id] = PALETTE[i % PALETTE.length]; });
    return m;
  }, [scoped.subjects]);
  const colorOf = useCallback((id) => colorById[id] || '#64748B', [colorById]);
  const colorByName = useCallback((name) => {
    const s = scoped.subjects.find((x) => x.name === name);
    return s ? colorOf(s.id) : '#64748B';
  }, [scoped.subjects, colorOf]);

  const studyByDate = useMemo(() => sumByDate(scoped.sessions), [scoped.sessions]);
  const reviewByDate = useMemo(() => sumByDate(scoped.reviewLogs), [scoped.reviewLogs]);
  const detail = useMemo(
    () => dayDetail({ sessions: scoped.sessions, reviewLogs: scoped.reviewLogs, date: selectedDate }),
    [scoped.sessions, scoped.reviewLogs, selectedDate]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Estatísticas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {scoped.activePlan && planScope === 'active' ? `Plano: ${scoped.activePlan.name}` : plans.length > 1 ? 'Todos os planos' : 'Acompanhe sua evolução detalhada'}
          </p>
        </div>
        {plans.length > 1 && (
          <select value={planScope} onChange={(e) => setPlanScope(e.target.value)} className={`${SELECT_CLASS} !w-auto`} aria-label="Plano">
            <option value="active">Plano ativo</option>
            <option value="all">Todos os planos</option>
          </select>
        )}
      </div>

      <StatsTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'resumo' && (
        <div className="space-y-6">
          <OverviewKpis kpis={agg.kpis} />
          <div>
            <p className="text-sm font-semibold mb-3">Por matéria</p>
            <SubjectStats subjects={agg.subjects} unknown={agg.unknown} colorOf={colorOf} hasPlans={plans.length > 0} />
          </div>
        </div>
      )}

      {tab === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <StatsCalendar
            selectedDate={selectedDate}
            onSelect={selectDate}
            month={moment(`${calMonth}-01`)}
            onPrev={() => setCalMonth(moment(`${calMonth}-01`).subtract(1, 'month').format('YYYY-MM'))}
            onNext={() => setCalMonth(moment(`${calMonth}-01`).add(1, 'month').format('YYYY-MM'))}
            studyByDate={studyByDate}
            reviewByDate={reviewByDate}
          />
          <DayHistoryCard date={selectedDate} detail={detail} colorByName={colorByName} />
        </div>
      )}

      {tab === 'graficos' && (
        <StatsCharts
          sessions={scoped.sessions}
          reviewLogs={scoped.reviewLogs}
          subjects={scoped.subjects}
          colorOf={colorOf}
          filter={chartFilter}
          onFilter={setChartFilter}
          refDate={selectedDate}
          onRefDate={selectDate}
        />
      )}

      {tab === 'revisoes' && (
        <div className="space-y-4">
          <ReviewStats kpis={agg.kpis} subjects={agg.subjects} unknown={agg.unknown} />
          <ReviewTimeCard defaultDate={today} subjects={scoped.subjects} topics={scoped.topics} onLogged={reload} />
        </div>
      )}
    </div>
  );
}
