import React from 'react';

export default function NeonProgress({ value = 0, max = 100, color = 'blue', className = '', size = 'md' }) {
  const pct = Math.min((value / max) * 100, 100);
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const colors = {
    blue: 'bg-blue-500 progress-glow-blue',
    purple: 'bg-purple-500 progress-glow-purple',
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
  };

  return (
    <div className={`w-full bg-muted/50 rounded-full overflow-hidden ${heights[size]} ${className}`}>
      <div
        className={`${heights[size]} rounded-full transition-all duration-700 ease-out ${colors[color]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
