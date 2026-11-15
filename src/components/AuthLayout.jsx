import React from "react";
import { Swords } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Swords className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
        </div>

        <div className="glass-card rounded-2xl border border-border/50 p-8">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
