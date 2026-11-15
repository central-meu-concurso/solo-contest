import React from 'react';

export default function GlassCard({ children, className = '', hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-xl p-5 ${hover ? 'glass-card-hover cursor-pointer transition-all duration-300' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
