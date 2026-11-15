import React from 'react';
import { Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { formatStudyTime } from '@/lib/studyUtils';

export default function DayBlocksCard({ total, blocks, period }) {
  const max = Math.max(1, ...blocks.map(b => b.minutes));

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold">{period === 'daily' ? 'Tempo do dia' : 'Blocos do período'}</p>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-lg font-display font-bold neon-blue">{formatStudyTime(total)}</span>
        </div>
      </div>
      {blocks.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhum registro</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {blocks.map(b => (
            <div
              key={b.id}
              className="rounded-lg p-2 flex flex-col items-center justify-center min-h-[64px]"
              style={{ background: b.color + '22', border: `1px solid ${b.color}55` }}
            >
              <div className="w-full h-1.5 rounded-full bg-white/10 mb-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(8, (b.minutes / max) * 100)}%`, background: b.color }}
                />
              </div>
              <span className="text-[10px] text-foreground/80 truncate w-full text-center">{b.label}</span>
              <span className="text-[10px] font-display" style={{ color: b.color }}>{formatStudyTime(b.minutes)}</span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
