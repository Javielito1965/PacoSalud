import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Smartphone, 
  Download, 
  Share2, 
  Check, 
  Copy, 
  X, 
  ExternalLink, 
  Server, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { safeCopyText } from '../utils/safeStorage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'direct' | 'cloudflare' | 'vercel' | 'netlify' | 'github'>('cloudflare');
  const { isInstallable, install } = usePWAInstall();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // The actual live URL (guarded for SSR)
  const appUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const isTempDevUrl =
    appUrl.includes('ais-dev-') ||
    appUrl.includes('localhost') ||
    appUrl.includes('127.0.0.1');

  const handleCopyUrl = async () => {
    const ok = await safeCopyText(appUrl);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    }
  };

  const handleCopyVercel = async () => {
    const ok = await safeCopyText('npm run build');
    if (ok) {
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 3000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-4 sm:p-8 my-2 sm:my-8 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Subir a Web Gratuita y Usar como App
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PWA instalable en móviles, tablets y opciones de alojamiento 100% gratuito
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live URL Box */}
        <div className={`p-4 rounded-2xl border mb-6 ${
          isTempDevUrl
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
            : 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/60'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className={`text-xs font-bold uppercase tracking-wide ${
              isTempDevUrl ? 'text-amber-900 dark:text-amber-200' : 'text-teal-900 dark:text-teal-200'
            }`}>
              {isTempDevUrl ? 'Enlace temporal de pruebas (desarrollo)' : '¡Tu Web App ya está disponible online!'}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isTempDevUrl
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              {isTempDevUrl ? 'Se suspende al inactivo' : 'Online 24/7'}
            </span>
          </div>
          {isTempDevUrl ? (
            <div className="text-xs text-amber-900/90 dark:text-amber-200/90 mb-3 space-y-1.5">
              <p className="flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Este enlace de desarrollo (<code>ais-dev-...</code>) se apaga automáticamente tras un tiempo sin uso. Para que la app esté <strong>operativa 24/7 siempre</strong>, usa el botón <strong>Compartir / Publicar</strong> de AI Studio (enlace permanente) o publícala gratis en Vercel, Netlify o Cloudflare Pages e instálala como PWA en el móvil.
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
              Puedes abrir este enlace en el navegador de cualquier teléfono o tablet y funcionará directamente incluso sin cobertura una vez instalada como PWA:
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              readOnly
              value={appUrl}
              className="flex-1 min-w-0 text-xs p-2.5 rounded-xl border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedUrl ? 'Copiado' : 'Copiar URL'}</span>
            </button>
          </div>
        </div>

        {/* Platform Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Selecciona cómo deseas alojarla o utilizarla:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setActivePlatform('cloudflare')}
              className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                activePlatform === 'cloudflare'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              ☁️ Cloudflare
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('direct')}
              className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                activePlatform === 'direct'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              📱 Instalar Móvil
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('vercel')}
              className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                activePlatform === 'vercel'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              ▲ Vercel
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('netlify')}
              className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                activePlatform === 'netlify'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              🌐 Netlify
            </button>

            <button
              type="button"
              onClick={() => setActivePlatform('github')}
              className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center col-span-2 sm:col-span-1 ${
                activePlatform === 'github'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              🐙 GitHub
            </button>
          </div>
        </div>

        {/* Content based on selected platform */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 space-y-3">
          
          {activePlatform === 'cloudflare' && (
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Server className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Subir a Cloudflare Pages (Gratis, 24/7 sin suspensión)</span>
              </h4>
              <p>
                Cloudflare Pages mantiene tu aplicación activa 24/7 con ancho de banda ilimitado, HTTPS y soporte PWA completo en un dominio fijo (<code>cuidafam-pro.pages.dev</code>).
              </p>
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">Opción A: Desde GitHub (automático)</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Exporta o sube el proyecto a un repositorio en <strong>GitHub</strong>.</li>
                  <li>Entra en <strong>dash.cloudflare.com</strong> &gt; <strong>Compute (Workers &amp; Pages)</strong> &gt; <strong>Create</strong> &gt; <strong>Pages</strong> &gt; <strong>Connect to Git</strong>.</li>
                  <li>
                    Configura la compilación:
                    <div className="bg-slate-900 text-teal-300 p-2 rounded-lg font-mono text-[11px] my-1 overflow-x-auto">
                      Build command: npm run build<br />
                      Build output directory: dist
                    </div>
                  </li>
                  <li>Pulsa <strong>Save and Deploy</strong>.</li>
                </ol>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">Opción B: Subida directa (sin GitHub)</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Descarga el proyecto y ejecuta en tu ordenador: <code>npm install &amp;&amp; npm run build</code>.</li>
                  <li>En Cloudflare Pages elige <strong>Upload assets</strong> (Direct Upload).</li>
                  <li>Arrastra la carpeta <code>dist/</code> generada y pulsa <strong>Deploy site</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {activePlatform === 'direct' && (
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-teal-600" />
                <span>Cómo instalarla como App en el teléfono de los familiares:</span>
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">En Android (Chrome):</span>
                  <span>
                    Abre el enlace en Chrome. Pulsa los tres puntos <strong>(⋮)</strong> arriba a la derecha y selecciona <strong>&quot;Instalar aplicación&quot;</strong> o pulsa el botón &quot;Instalar App&quot;. Se creará un icono independiente en la pantalla de inicio sin barra de navegador.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">En iPhone / iPad (Safari):</span>
                  <span>
                    Abre el enlace en Safari. Pulsa el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) y elige <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-teal-600">En Ordenador (Chrome / Edge):</span>
                  <span>
                    Aparece un icono de pantalla con flecha de descarga en la barra de direcciones para tenerla en el escritorio como aplicación de PC o Mac.
                  </span>
                </li>
              </ul>

              {isInstallable && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      install();
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar en este dispositivo ahora</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activePlatform === 'vercel' && (
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                Subir gratis a Vercel (Recomendado - 2 minutos):
              </h4>
              <p className="mb-2">
                Vercel te da un dominio gratuito permanente (ej: <code>cuidafam-pro.vercel.app</code>) con HTTPS seguro y soporte PWA instantáneo:
              </p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Crea una cuenta gratuita en <strong>vercel.com</strong> con tu cuenta de GitHub o correo.</li>
                <li>Sube este proyecto a tu repositorio de GitHub o arrastra la carpeta.</li>
                <li>Importa el repositorio en Vercel. Detectará automáticamente que es un proyecto <strong>Vite React</strong>.</li>
                <li>
                  Configuración de compilación:
                  <div className="bg-slate-900 text-teal-300 p-2 rounded-lg font-mono text-[11px] my-1 overflow-x-auto">
                    Build Command: npm run build<br />
                    Output Directory: dist
                  </div>
                </li>
                <li>¡Pulsa <strong>Deploy</strong> y en 30 segundos tendrás tu propia web gratuita lista para compartir!</li>
              </ol>
            </div>
          )}

          {activePlatform === 'netlify' && (
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                Subir gratis a Netlify (Opción Drag & Drop sin código):
              </h4>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Ejecuta <code>npm run build</code> para generar la carpeta <code>dist/</code>.</li>
                <li>Entra en <strong>netlify.com</strong> y crea una cuenta gratuita.</li>
                <li>En la sección <strong>&quot;Sites&quot;</strong>, arrastra directamente la carpeta <code>dist/</code> generada.</li>
                <li>Tu web estará disponible al instante con un enlace tipo <code>cuidafam.netlify.app</code> sin configurar servidores.</li>
              </ol>
            </div>
          )}

          {activePlatform === 'github' && (
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                Subir gratis a GitHub Pages:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Crea un repositorio público en <strong>github.com</strong>.</li>
                <li>Sube el código con git.</li>
                <li>En <strong>Settings &gt; Pages</strong> de tu repositorio, activa GitHub Actions con la plantilla oficial de Vite.</li>
                <li>Tu app se publicará en <code>tunombre.github.io/tu-repo/</code>.</li>
              </ol>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs shadow-xs"
          >
            Cerrar Guía
          </button>
        </div>

      </div>
    </div>
  );
};
