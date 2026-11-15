import React from 'react';
import moment from 'moment';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/ui/GlassCard';

const PT_MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const PT_WEEK = ['D','S','T','Q','Q','S','S'];

export default function StatsCalendar({ selectedDate, onSelect, month, onPrev, onNext, studyByDate = {}, reviewByDate = {} }) {
  const startOfMonth = moment(month).startOf('month');
  const startDay = startOfMonth.day();
  const daysInMonth = moment(month).daysInMonth();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(moment(month).date(d));
  const today = moment().format('YYYY-MM-DD');

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="p-2 rounded-lg hover:bg-muted/50 touch-target" aria-label="Mês anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold font-display capitalize">
          {PT_MONTHS[moment(month).month()]} {moment(month).format('YYYY')}
        </p>
        <button onClick={onNext} className="p-2 rounded-lg hover:bg-muted/50 touch-target" aria-label="Próximo mês">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {PT_WEEK.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const ds = c.format('YYYY-MM-DD');
          const isSelected = ds === selectedDate;
          const isToday = ds === today;
          const hasStudy = (studyByDate[ds] || 0) > 0;
          const hasReview = (reviewByDate[ds] || 0) > 0;
          return (
            <button
              key={i}
              onClick={() => onSelect(ds)}
              className={cn(
                'relative aspect-square rounded-lg text-xs flex items-center justify-center transition-colors touch-target',
                isSelected
                  ? 'bg-primary text-primary-foreground font-bold'
                  : isToday
                    ? 'bg-primary/10 text-primary border border-primary/30'
                    : 'hover:bg-muted/40 text-foreground/80'
              )}
            >
              {c.date()}
              {(hasStudy || hasReview) && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {hasStudy && <span className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-blue-400')} />}
                  {hasReview && <span className={cn('w-1 h-1 rounded-full', isSelected ? 'bg-primary-foreground/70' : 'bg-purple-400')} />}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Estudo</span>
        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Revisão</span>
      </div>
    </GlassCard>
  );
}
