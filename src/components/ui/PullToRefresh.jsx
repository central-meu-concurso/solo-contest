import React, { useState, useRef } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = (e) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  };

  const onTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPull(delta * 0.5);
    } else {
      pulling.current = false;
      setPull(0);
    }
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try { await onRefresh?.(); } catch (e) { console.error(e); }
      setRefreshing(false);
    }
    setPull(0);
  };

  const progress = Math.min(pull / THRESHOLD, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: refreshing ? THRESHOLD : pull }}
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        ) : pull > 5 ? (
          <RotateCcw
            className="w-5 h-5 text-blue-400 transition-transform"
            style={{ transform: `rotate(${progress * 360}deg)` }}
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}
