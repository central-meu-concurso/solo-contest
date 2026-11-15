import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
// HashRouter: funciona em qualquer lugar (navegador, app Android/WebView) sem configurar servidor.
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import StudyPlans from '@/pages/StudyPlans';
import PlanDetail from '@/pages/PlanDetail';
import Subjects from '@/pages/Subjects';
import Reviews from '@/pages/Reviews';
import Questions from '@/pages/Questions';
import Statistics from '@/pages/Statistics';
import SettingsPage from '@/pages/SettingsPage';
import WhereIStopped from '@/pages/WhereIStopped';
import Backups from '@/pages/Backups';

function App() {
  return (
    <AuthProvider>
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<Navigate to="/forgot-password" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/plans" element={<StudyPlans />} />
              <Route path="/plans/:planId" element={<PlanDetail />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/stats" element={<Statistics />} />
              <Route path="/where-i-stopped" element={<WhereIStopped />} />
              <Route path="/backups" element={<Backups />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
