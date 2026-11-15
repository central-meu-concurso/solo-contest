import React from 'react';
import moment from 'moment';
import { RotateCcw, BookOpen } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { fmt, fmtFull } from './fmt';
import { weekdayName, dayFull } from '@/lib/statsUtils';

const endOf = (start, minutes) => {
  if (!start || !minutes) return '';
  const t = moment(start, 'HH:mm').add(minutes, 'minutes');
  return t.isValid() ? t.format('HH:mm') : '';
};

export default function DayHistoryCard({ date, detail, colorByName }) {
  const d = detail;
  const empty = d.activities.length === 0;
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <p className="text-sm font-semibold">Histórico do dia</p>
          <p className="text-[11px] text-muted-foreground">{dayFull(date)} · {weekdayName(date)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Total do dia</p>
          <p className="text-lg font-display font-bold neon-blue">{fmtFull(d.totalMin)}</p>
        </div>
      </div>

      {empty ? (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhuma atividade registrada neste dia.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Estudo</p>
              <p className="text-base font-display font-bold text-blue-400">{fmtFull(d.studyMin)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Revisões</p>
              <p className="text-base font-display font-bold text-purple-400">{fmtFull(d.reviewMin)}</p>
            </div>
          </div>

          {d.subjects.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Matérias estudadas</p>
              <div className="space-y-1.5">
                {d.subjects.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorByName(s.name) }} />
                      <span className="truncate">{s.name}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0 ml-2">{fmtFull(s.minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {d.topics.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Assuntos estudados</p>
              <div className="space-y-1.5">
                {d.topics.map((t) => (
                  <div key={t.subject + t.topic} className="flex items-center justify-between text-xs">
                    <span className="truncate">{t.topic} <span className="text-muted-foreground">· {t.subject}</span></span>
                    <span className="text-muted-foreground shrink-0 ml-2">{fmtFull(t.minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-muted-foreground mb-2">Atividades</p>
            <div className="relative pl-4 space-y-2 max-h-80 overflow-y-auto">
              <div className="absolute left-1 top-1 bottom-1 w-px bg-border/60" />
              {d.activities.map((a) => {
                const review = a.kind === 'review';
                const color = review ? '#A78BFA' : colorByName(a.subject);
                const end = endOf(a.start, a.minutes);
                return (
                  <div key={a.id} className="relative">
                    <span className="absolute -left-3 top-3 w-2.5 h-2.5 rounded-full ring-2 ring-background" style={{ background: color }} />
                    <div className="flex items-center justify-between rounded-lg bg-muted/20 py-2 px-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate flex items-center gap-1.5">
                          {review ? <RotateCcw className="w-3.5 h-3.5 text-purple-400 shrink-0" /> : <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                          <span className="truncate">{review ? 'Revisão' : (a.topic || a.subject)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[review ? (a.topic ? `${a.subject} · ${a.topic}` : a.subject) : (a.topic ? a.subject : ''), a.start ? (end ? `${a.start}–${end}` : a.start) : '']
                            .filter(Boolean).join(' · ') || (review ? 'Sem matéria informada' : '')}
                        </p>
                      </div>
                      <span className={`text-sm font-display shrink-0 ${review ? 'text-purple-400' : 'text-blue-400'}`}>{fmt(a.minutes)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
