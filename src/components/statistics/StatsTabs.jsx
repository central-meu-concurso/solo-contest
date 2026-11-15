
import React from 'react';
import { cn } from '@/lib/utils';

export default function StatsTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl glass-card select-none overflow-x-auto">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex-1 min-w-0 px-2 sm:px-4 py-2 rounded-lg text-xs font-medium transition-colors touch-target whitespace-nowrap',
            active === t.id
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
