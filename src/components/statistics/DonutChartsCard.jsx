import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const tooltip = {
  backgroundColor: 'rgba(20, 24, 40, 0.9)',
  border: '1px solid rgba(99, 140, 255, 0.2)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

export default function DonutChartsCard({ subjectData }) {
  const total = Math.round(subjectData.reduce((a, d) => a + d.value, 0) * 10) / 10;

  return (
    <GlassCard>
      <p className="text-sm font-semibold mb-4">Distribuição por matéria</p>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative h-40 w-40 shrink-0">
          {subjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subjectData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} dataKey="value" nameKey="name" paddingAngle={2}>
                  {subjectData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltip} formatter={(v, name) => [`${v}h`, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Sem dados</div>
          )}
          {subjectData.length > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-display font-bold neon-blue">{total}h</span>
              <span className="text-[10px] text-muted-foreground">total</span>
            </div>
          )}
        </div>
        <div className="flex-1 w-full space-y-1.5">
          {subjectData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma matéria estudada no período</p>
          ) : subjectData.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="text-muted-foreground shrink-0 ml-2">{d.value}h</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
