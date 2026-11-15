import React from 'react';
import { Clock, CalendarDays, Hourglass } from 'lucide-react';
import StatBox from '@/components/ui/StatBox';
import GlassCard from '@/components/ui/GlassCard';
import { fmt, fmtFull } from './fmt';

function Row({ title, sub, t }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 sm:gap-x-5 rounded-lg bg-muted/20 py-2.5 px-3">
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
      </div>
      <span className="text-xs w-12 sm:w-14 text-right">{fmt(t.rToday)}</span>
      <span className="text-xs w-12 sm:w-14 text-right">{fmt(t.rMonth)}</span>
      <span className="text-xs w-14 sm:w-16 text-right font-display text-purple-400">{fmt(t.rTotal)}</span>
    </div>
  );
}

const Head = ({ first }) => (
  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-3 sm:gap-x-5 px-3 text-[10px] text-muted-foreground">
    <span>{first}</span>
    <span className="w-12 sm:w-14 text-right">Hoje</span>
    <span className="w-12 sm:w-14 text-right">No mês</span>
    <span className="w-14 sm:w-16 text-right">Total</span>
  </div>
);

export default function ReviewStats({ kpis, subjects, unknown }) {
  const all = unknown ? [...subjects, unknown] : subjects;
  const bySubject = all.filter((s) => s.rTotal > 0).sort((a, b) => b.rTotal - a.rTotal);
  const byTopic = [];
  all.forEach((s) => {
    s.topics.forEach((t) => { if (t.rTotal > 0) byTopic.push({ ...t, subject: s.name }); });
  });
  byTopic.sort((a, b) => b.rTotal - a.rTotal);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3">
        <StatBox icon={Clock} color="purple" label="Hoje" value={fmtFull(kpis.reviewToday)} />
        <StatBox icon={CalendarDays} color="purple" label="No mês" value={fmtFull(kpis.reviewMonth)} />
        <StatBox icon={Hourglass} color="purple" label="Total" value={fmtFull(kpis.reviewTotal)} />
      </div>

      <GlassCard>
        <p className="text-sm font-semibold mb-3">Revisão por matéria</p>
        {bySubject.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma revisão com matéria registrada ainda.</p>
        ) : (
          <div className="space-y-1.5">
            <Head first="Matéria" />
            {bySubject.map((s) => <Row key={s.id} title={s.name} t={s} />)}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <p className="text-sm font-semibold mb-3">Revisão por assunto</p>
        {byTopic.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma revisão com assunto registrada ainda.</p>
        ) : (
          <div className="space-y-1.5">
            <Head first="Assunto" />
            {byTopic.map((t) => <Row key={t.id} title={t.name} sub={t.subject} t={t} />)}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
