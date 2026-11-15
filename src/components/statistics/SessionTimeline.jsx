import React from 'react';
import moment from 'moment';
import GlassCard from '@/components/ui/GlassCard';
import { formatStudyTime } from '@/lib/studyUtils';

export default function SessionTimeline({ sessions, subjectColorMap }) {
  return (
    <GlassCard>
      <p className="text-sm font-semibold mb-4">Linha do tempo</p>
      {sessions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">Nenhum registro neste período</p>
      ) : (
        <div className="relative pl-4 space-y-3 max-h-96 overflow-y-auto">
          <div className="absolute left-1 top-1 bottom-1 w-px bg-border/60" />
          {sessions.map(s => {
            const color = subjectColorMap[s.subject_name] || '#3B82F6';
            return (
              <div key={s.id} className="relative">
                <span
                  className="absolute -left-3 top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-background"
                  style={{ background: color }}
                />
                <div className="flex items-center justify-between rounded-lg bg-muted/20 py-2 px-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.topic_name || s.subject_name || 'Estudo'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {moment(s.date).format('DD/MM/YYYY')}{s.start_time ? ` · ${s.start_time}` : ''}{s.subject_name ? ` · ${s.subject_name}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-display text-blue-400 shrink-0">{formatStudyTime(s.duration_minutes || 0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
