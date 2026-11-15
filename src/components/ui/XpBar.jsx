import React from 'react';
import { calculateLevel } from '@/lib/studyUtils';
import NeonProgress from './NeonProgress';
import { Zap } from 'lucide-react';

export default function XpBar({ xp = 0 }) {
  const { level, progress, nextLevelXp } = calculateLevel(xp);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/20">
        <Zap className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-sm font-display font-bold text-purple-400">Nv.{level}</span>
      </div>
      <div className="flex-1">
        <NeonProgress value={progress} max={100} color="purple" size="sm" />
        <p className="text-[10px] text-muted-foreground mt-1">{xp} / {nextLevelXp} XP</p>
      </div>
    </div>
  );
}
