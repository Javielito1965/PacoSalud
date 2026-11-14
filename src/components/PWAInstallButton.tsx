import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share2, PlusSquare, X, Globe, CheckCircle2, Copy } from 'lucide-react';

interface Props {
  onOpenDeployGuide?: () => void;
}

export const PWAInstallButton: React.FC<Props> = ({ onOpenDeployGuide }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed as standalone PWA
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>App Instalada</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="px-2 sm:px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 shrink-0"
        title="Instalar CUIDAFAM PRO en este dispositivo"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Instalar</span>
        <span className="hidden min-[440px]:inline">App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="px-2 sm:px-3 py-1.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-teal-100 transition-colors shrink-0"
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden min-[440px]:inline">App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base truncate">Instalar en iPhone / iPad</h3>
                    <p className="text-xs text-slate-500">Funciona a pantalla completa como app</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 my-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    Abre esta página en <strong>Safari</strong> y pulsa el botón de <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline text-teal-600" /> en la barra inferior.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    Baja en las opciones y selecciona <strong>&quot;Añadir a pantalla de inicio&quot;</strong> <PlusSquare className="w-3.5 h-3.5 inline text-teal-600" />.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    Pulsa <strong>Añadir</strong> en la esquina superior derecha. ¡Listo! El icono de CUIDAFAM PRO aparecerá entre tus apps.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback trigger (or button to open installation guide)
  return (
    <button
      type="button"
      onClick={onOpenDeployGuide}
      className="px-2 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
      title="Cómo usar como App Web o subir a web gratuita"
    >
      <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
      <span className="hidden sm:inline">Web App</span>
      <span className="hidden min-[440px]:inline">PWA</span>
    </button>
  );
};
