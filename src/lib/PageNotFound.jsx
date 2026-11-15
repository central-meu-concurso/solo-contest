import { Link, useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-muted-foreground">404</h1>
          <div className="h-0.5 w-16 bg-border mx-auto"></div>
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-medium">Página não encontrada</h2>
          <p className="text-muted-foreground leading-relaxed">
            A página <span className="font-medium text-foreground">"{pageName}"</span> não existe neste aplicativo.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
