import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Library } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { fmt, fmtFull } from './fmt';

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-muted/20 p-3">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className="text-base font-display font-bold">{value}</p>
    </div>
  );
}

function ReviewLine({ s }) {
  if (!(s.rTotal > 0)) return null;
  return (
    <p className="text-[11px] text-purple-400 mt-2">
      Revisão · hoje {fmt(s.rToday)} · mês {fmt(s.rMonth)} · total {fmt(s.rTotal)}
    </p>
  );
}

function TopicRow({ name, t, muted }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-3 sm:gap-x-5 rounded-lg bg-muted/20 py-2.5 px-3">
      <div className="min-w-0">
        <p className={`text-sm truncate ${muted ? 'text-muted-foreground italic' : 'font-medium'}`}>{name}</p>
        {t.rTotal > 0 && <p className="text-[10px] text-purple-400">revisão: {fmtFull(t.rTotal)}</p>}
      </div>
      <span className="text-xs w-12 sm:w-14 text-right">{fmt(t.today)}</span>
      <span className="text-xs w-12 sm:w-14 text-right">{fmt(t.month)}</span>
      <span className="text-xs w-14 sm:w-16 text-right font-display text-blue-400">{fmt(t.total)}</span>
    </div>
  );
}

export default function SubjectStats({ subjects, unknown, colorOf, hasPlans }) {
  const [selectedId, setSelectedId] = useState(null);
  const all = unknown ? [...subjects, unknown] : subjects;
  const selected = all.find((s) => s.id === selectedId);

  if (!all.length) {
    return (
      <GlassCard>
        <div className="flex flex-col items-center text-center py-8 gap-2">
          <Library className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-semibold">Nenhuma matéria cadastrada</p>
          <p className="text-xs text-muted-foreground">
            {hasPlans ? 'Cadastre matérias no seu plano e elas aparecem aqui automaticamente.' : 'Crie um plano de estudos para começar.'}
          </p>
        </div>
      </GlassCard>
    );
  }

  if (selected) {
    const topics = [...selected.topics.values()];
    const hasLoose = selected.loose.total > 0 || selected.loose.rTotal > 0;
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground touch-target">
          <ChevronLeft className="w-4 h-4" /> Todas as matérias
        </button>
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: colorOf(selected.id) }} />
            <h2 className="text-lg font-display font-bold truncate">{selected.name}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Hoje" value={fmtFull(selected.today)} />
            <Metric label="No mês" value={fmtFull(selected.month)} />
            <Metric label="Total" value={fmtFull(selected.total)} />
          </div>
          <ReviewLine s={selected} />
        </GlassCard>

        <GlassCard>
          <p className="text-sm font-semibold mb-3">Assuntos</p>
          {topics.length === 0 && !hasLoose ? (
            <p className="text-xs text-muted-foreground text-center py-6">Esta matéria ainda não tem assuntos cadastrados.</p>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-3 sm:gap-x-5 px-3 text-[10px] text-muted-foreground">
                <span>Assunto</span>
                <span className="w-12 sm:w-14 text-right">Hoje</span>
                <span className="w-12 sm:w-14 text-right">No mês</span>
                <span className="w-14 sm:w-16 text-right">Total</span>
              </div>
              {topics.map((t) => <TopicRow key={t.id} name={t.name} t={t} />)}
              {hasLoose && <TopicRow name="Sem assunto específico" t={selected.loose} muted />}
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {all.map((s) => (
        <GlassCard key={s.id} hover onClick={() => setSelectedId(s.id)}>
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorOf(s.id) }} />
              <p className="text-sm font-semibold truncate">{s.name}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Hoje" value={fmt(s.today)} />
            <Metric label="No mês" value={fmt(s.month)} />
            <Metric label="Total" value={fmt(s.total)} />
          </div>
          <ReviewLine s={s} />
        </GlassCard>
      ))}
    </div>
  );
}
