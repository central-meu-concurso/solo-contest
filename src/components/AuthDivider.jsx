export default function AuthDivider({ children = 'ou' }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase text-muted-foreground">{children}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
