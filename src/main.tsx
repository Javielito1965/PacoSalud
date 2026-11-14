import React, { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Automatically recover once if a stale cached chunk fails to load after an update
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    try {
      const key = 'cuidafam_preload_reload';
      if (!window.sessionStorage.getItem(key)) {
        window.sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  });
}

// Register PWA Service Worker for offline resilience and silent updates
try {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Check for updates periodically and when returning to the app on mobile
      const checkUpdate = () => {
        registration.update().catch(() => {});
      };
      setInterval(checkUpdate, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkUpdate();
        }
      });
    },
    onRegisterError(error) {
      console.warn('Service worker registration skipped:', error);
    },
  });
} catch {
  // Never block app boot if service worker API is unavailable
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CUIDAFAM PRO Runtime Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('cuidafam_pro_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignore restricted storage
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center font-bold text-xl mb-3">
              CP
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              CUIDAFAM PRO
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Se ha detectado una interrupción temporal. Tus registros médicos siguen guardados en el dispositivo.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left text-[11px] text-slate-600 font-mono mb-4 overflow-x-auto break-words">
              {this.state.error?.message || 'Error temporal de visualización'}
            </div>
            <div className="space-y-2">
              <button
                onClick={this.handleRetry}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Reintentar sin borrar datos
              </button>
              <button
                onClick={this.handleReload}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Recargar página
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2 px-4 text-rose-600 hover:bg-rose-50 font-medium text-[11px] rounded-xl transition-colors"
              >
                Restablecer datos de fábrica (solo si persiste)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

