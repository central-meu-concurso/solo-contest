import React from 'react';
import GlassCard from './GlassCard';

export default function StatBox({ icon: Icon, label, value, sub, color = 'blue' }) {
  const iconColors = {
    blue: 'text-blue-400 bg-blue-500/15',
    purple: 'text-purple-400 bg-purple-500/15',
    green: 'text-emerald-400 bg-emerald-500/15',
    yellow: 'text-yellow-400 bg-yellow-500/15',
    red: 'text-red-400 bg-red-500/15',
  };

  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconColors[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-xl font-bold font-display break-words">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </GlassCard>
  );
}
