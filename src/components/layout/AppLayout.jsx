
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/lib/AuthContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  LayoutDashboard, BookOpen, Library, RotateCcw,
  HelpCircle, BarChart3, Settings, Menu, Swords, LogOut, Bookmark, Database, Home as HomeIcon, ArrowLeft, Sun, Moon
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/plans', label: 'Plano de Estudos', icon: BookOpen },
  { path: '/subjects', label: 'Matérias', icon: Library },
  { path: '/reviews', label: 'Revisões', icon: RotateCcw },
  { path: '/questions', label: 'Questões', icon: HelpCircle },
  { path: '/stats', label: 'Estatísticas', icon: BarChart3 },
  { path: '/where-i-stopped', label: 'Onde Parei', icon: Bookmark },
  { path: '/backups', label: 'Backups', icon: Database },
  { path: '/settings', label: 'Configurações', icon: Settings },
];

// Destaques da barra inferior (mobile/tablet)
const bottomNavItems = [
  { path: '/', label: 'Dashboard', icon: HomeIcon },
  { path: '/plans', label: 'Planos', icon: BookOpen },
  { path: '/reviews', label: 'Avaliações', icon: RotateCcw },
  { path: '/stats', label: 'Stats', icon: BarChart3 },
  { path: '/settings', label: 'Ajustes', icon: Settings },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const scrollMap = useRef({});
  const lastPath = useRef(location.pathname);

  const { isDark, toggleTheme } = useTheme();
  const { user, isCloud, signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Preserva a posição de rolagem por aba
  useEffect(() => {
    const onScroll = () => {
      scrollMap.current[lastPath.current] = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const saved = scrollMap.current[location.pathname] ?? 0;
    requestAnimationFrame(() => window.scrollTo(0, saved));
    lastPath.current = location.pathname;
  }, [location.pathname]);

  const navigate = useNavigate();
  const tabHistoryRef = useRef({});
  const tabRoots = ['/', '/plans', '/reviews', '/stats', '/settings'];

  const findGroup = (path) => {
    if (path === '/') return '/';
    for (const root of tabRoots) {
      if (root !== '/' && (path === root || path.startsWith(root + '/'))) return root;
    }
    return null;
  };

  // Preserva o último caminho visitado por aba
  useEffect(() => {
    const group = findGroup(location.pathname);
    if (group) tabHistoryRef.current[group] = location.pathname;
  }, [location.pathname]);

  const handleTabClick = (root) => {
    const group = findGroup(location.pathname);
    if (group === root) {
      // aba já ativa: reseta para a raiz
      navigate(root);
    } else {
      // volta ao último caminho da aba, ou raiz
      navigate(tabHistoryRef.current[root] || root);
    }
  };

  const isNested = (() => {
    const group = findGroup(location.pathname);
    return !!group && location.pathname !== group;
  })();

  const handleBack = () => {
    const group = findGroup(location.pathname);
    navigate(group || '/');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const isPathActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 glass-card border-r border-border/50 flex flex-col transition-transform duration-300 select-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-border/30 safe-top">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-wider bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SOLO
              </h1>
              <p className="text-[10px] font-display tracking-[0.3em] text-muted-foreground -mt-1">CONTEST</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = isPathActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 touch-target ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/30 safe-bottom space-y-1">
          <button onClick={toggleTheme} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all w-full touch-target">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Modo claro' : 'Modo escuro'}
          </button>
          {isCloud && (
            <>
              {user?.email && <p className="px-4 pt-1 text-[11px] text-muted-foreground truncate" title={user.email}>{user.email}</p>}
              <button onClick={() => setConfirmLogout(true)} className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all w-full touch-target">
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0 min-h-screen overflow-x-clip">
        <header className="sticky top-0 z-30 glass-card border-b border-border/30 px-4 py-3 lg:hidden flex items-center gap-3 select-none safe-top">
          {isNested ? (
            <button onClick={handleBack} className="p-2 rounded-lg hover:bg-muted/50 touch-target" aria-label="Voltar">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted/50 touch-target" aria-label="Abrir menu">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-blue-400" />
            <span className="font-display text-sm font-bold tracking-wider bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">SOLO CONTEST</span>
          </div>
          <div className="flex-1" />
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted/50 touch-target" aria-label="Alternar tema">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto pb-28 lg:pb-8">
          <Outlet />
        </div>

        {/* Barra de navegação inferior (mobile/tablet) — oculta em rotas filhas */}
        {!isNested && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-card border-t border-border/50 flex items-stretch justify-around select-none safe-bottom">
          {bottomNavItems.map(item => {
            const isActive = isPathActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleTabClick(item.path)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[10px] font-medium transition-colors touch-target ${
                  isActive ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        )}
      </main>

      <AlertDialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <AlertDialogContent className="bg-card border-border/50 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Você precisará entrar novamente para acessar seus estudos neste aparelho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setConfirmLogout(false); handleLogout(); }}
              className="bg-red-600 hover:bg-red-700"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
