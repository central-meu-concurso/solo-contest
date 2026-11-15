import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import GlassCard from '@/components/ui/GlassCard';
import StatsTabs from './StatsTabs';
import DonutChartsCard from './DonutChartsCard';
import { chartTooltip, fmtFull } from './fmt';
import { totalsBySubject, evolution, fmtHours, addDays, addMonths, monthKey, monthName, dayFull } from '@/lib/statsUtils';

const FILTERS = [
  { id: 'day', label: 'Dia' },
  { id: 'month', label: 'Mês' },
  { id: 'total', label: 'Total' },
];
const STUDY = '#3B82F6';
const REVIEW = '#A78BFA';

const hoursTick = (m) => `${fmtHours(m)}h`;
const SUBTITLE = {
  day: 'Por dia · últimos 30 dias',
  month: 'Por mês · últimos 12 meses',
  total: 'Acumulado desde o primeiro registro',
};

export default function StatsCharts({ sessions, reviewLogs, subjects, colorOf, filter, onFilter, refDate, onRefDate }) {
  const scopeLabel = filter === 'day' ? dayFull(refDate) : filter === 'month' ? monthName(monthKey(refDate)) : 'Desde o início';

  const step = (dir) => {
    if (filter === 'day') onRefDate(addDays(refDate, dir));
    else if (filter === 'month') onRefDate(`${addMonths(monthKey(refDate), dir)}-01`);
  };

  const subjectData = useMemo(
    () => totalsBySubject({ records: sessions, subjects, filter, ref: refDate })
      .map((t) => ({ name: t.name, value: fmtHours(t.minutes), color: t.id === '__none' ? '#64748B' : colorOf(t.id) })),
    [sessions, subjects, filter, refDate, colorOf]
  );
  const reviewData = useMemo(
    () => totalsBySubject({ records: reviewLogs, subjects, filter, ref: refDate }),
    [reviewLogs, subjects, filter, refDate]
  );
  const reviewTotal = reviewData.reduce((a, r) => a + r.minutes, 0);
  const maxReview = Math.max(1, ...reviewData.map((r) => r.minutes));
  const series = useMemo(() => evolution({ sessions, reviewLogs, filter, ref: refDate }), [sessions, reviewLogs, filter, refDate]);
  const hasSeries = series.some((p) => p.study > 0 || p.review > 0);

  const tip = <Tooltip contentStyle={chartTooltip} formatter={(v, name) => [fmtFull(v), name]} />;
  const axis = { fill: '#64748b', fontSize: 10 };

  return (
    <div className="space-y-4">
      <StatsTabs tabs={FILTERS} active={filter} onChange={onFilter} />

      <div className="flex items-center justify-between rounded-xl glass-card px-2 py-1">
        {filter !== 'total' ? (
          <button onClick={() => step(-1)} className="p-2 rounded-lg hover:bg-muted/50 touch-target" aria-label="Anterior"><ChevronLeft className="w-4 h-4" /></button>
        ) : <span className="w-8" />}
        <p className="text-sm font-semibold font-display">{scopeLabel}</p>
        {filter !== 'total' ? (
          <button onClick={() => step(1)} className="p-2 rounded-lg hover:bg-muted/50 touch-target" aria-label="Próximo"><ChevronRight className="w-4 h-4" /></button>
        ) : <span className="w-8" />}
      </div>

      <DonutChartsCard subjectData={subjectData} />

      <GlassCard>
        <p className="text-sm font-semibold">Evolução do estudo</p>
        <p className="text-[11px] text-muted-foreground mb-4">{SUBTITLE[filter]}</p>
        {!hasSeries ? (
          <p className="text-xs text-muted-foreground text-center py-10">Sem registros para mostrar ainda.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              {filter === 'total' ? (
                <LineChart data={series}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} minTickGap={16} />
                  <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={hoursTick} width={40} />
                  {tip}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="study" name="Estudo" stroke={STUDY} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="review" name="Revisão" stroke={REVIEW} strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={series}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} interval={filter === 'day' ? 4 : 'preserveStartEnd'} minTickGap={12} />
                  <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={hoursTick} width={40} />
                  {tip}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="study" name="Estudo" stackId="t" fill={STUDY} />
                  <Bar dataKey="review" name="Revisão" stackId="t" fill={REVIEW} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4 gap-2">
          <div>
            <p className="text-sm font-semibold">Tempo de revisão</p>
            <p className="text-[11px] text-muted-foreground">Por matéria · {scopeLabel}</p>
          </div>
          <span className="text-lg font-display font-bold neon-purple">{fmtFull(reviewTotal)}</span>
        </div>
        {reviewData.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma revisão registrada neste período.</p>
        ) : (
          <div className="space-y-3">
            {reviewData.map((r) => (
              <div key={r.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="truncate">{r.name}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">{fmtFull(r.minutes)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(6, (r.minutes / maxReview) * 100)}%`, background: REVIEW }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
