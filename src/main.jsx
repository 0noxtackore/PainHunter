import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import AuthPage from './pages/AuthPage';
import AdminPanel from './pages/AdminPanel';
import LandingPage from './pages/LandingPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-slate-50">
      <img src="/img/logo_loading.png" alt="PainHunter" className="h-28 w-auto animate-logo-pulse" />
    </div>
  );
}

function AdminLoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-slate-50">
      <img src="/img/logo_loading.png" alt="PainHunter" className="h-40 w-auto animate-logo-pulse" />
    </div>
  );
}

function ProtectedApp() {
  const { user, role, roleLoaded, initializing } = useAuth();

  if (initializing || !roleLoaded) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (role === 'lider') return <Navigate to="/admin" replace />;
  return <App />;
}

function AdminRoute() {
  const { user, role, roleLoaded, initializing } = useAuth();

  if (initializing || !roleLoaded) return <AdminLoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (role !== 'lider') return <Navigate to="/chat" replace />;
  return <AdminPanel />;
}

function PublicOnly({ children }) {
  const { user, role, roleLoaded, initializing } = useAuth();
  if (initializing || !roleLoaded) return null;
  if (user && role === 'lider') return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/chat" replace />;
  return children;
}

function Landing() {
  const { user, role, roleLoaded, initializing } = useAuth();
  if (initializing || !roleLoaded) return null;
  if (user && role === 'lider') return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/chat" replace />;
  return <LandingPage />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
              <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />
              <Route path="/admin" element={<AdminRoute />} />
              <Route path="/chat" element={<ProtectedApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
