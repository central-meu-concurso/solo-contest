import React from 'react';
import { Clock, Trophy, Play, Flag } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import { formatStudyTime } from '@/lib/studyUtils';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const tooltip = {
  backgroundColor: 'rgba(20, 24, 40, 0.9)',
  border: '1px solid rgba(99, 140, 255, 0.2)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

export default function DayMetricsCard({ total, maxConcentration, start, end, currentLabel, prevLabel, currentTotal, prevTotal }) {
  const metrics = [
    { icon: Clock, label: 'Tempo total', value: formatStudyTime(total) },
    { icon: Trophy, label: 'Máx. concentração', value: formatStudyTime(maxConcentration) },
    { icon: Play, label: 'Início', value: start || '--:--' },
    { icon: Flag, label: 'Fim', value: end || '--:--' },
  ];
  const data = [
    { name: currentLabel, min: currentTotal, fill: '#3B82F6' },
    { name: prevLabel, min: prevTotal, fill: '#8B5CF6' },
  ];

  return (
    <GlassCard>
      <p className="text-sm font-semibold mb-4">Métricas do período</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg bg-muted/20 p-3">
            <div className="flex items-center gap-2 mb-1">
              <m.icon className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
            <p className="text-base font-display font-bold">{m.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-2">{currentLabel} vs {prevLabel}</p>
      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltip} formatter={(v) => [formatStudyTime(v), 'Tempo']} />
            <Bar dataKey="min" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
