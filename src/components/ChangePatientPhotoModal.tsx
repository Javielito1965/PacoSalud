import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Link as LinkIcon, 
  Camera, 
  Check, 
  Image as ImageIcon, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  currentAvatar: string;
  onSave: (newAvatarUrl: string) => void;
}

export const ChangePatientPhotoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  patientName,
  currentAvatar,
  onSave,
}) => {
  const [activeSource, setActiveSource] = useState<'device' | 'url' | 'presets'>('device');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar || '');
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentAvatar || '');
      setUrlInput(currentAvatar && currentAvatar.startsWith('http') ? currentAvatar : '');
      setUrlError('');
      setSuccessMessage('');
      setIsProcessing(false);
    }
  }, [isOpen, currentAvatar]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setUrlError('');
    setIsProcessing(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 512, 0.85);
      setPreviewUrl(compressedDataUrl);
      setSuccessMessage('¡Foto cargada y optimizada con éxito!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la fotografía.';
      setUrlError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processFile(file);
    }
  };

  const handleApplyUrl = () => {
    setUrlError('');
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Por favor introduce una dirección URL válida.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setUrlError('El enlace debe comenzar por http:// o https://');
      return;
    }

    // Test image load
    const testImg = new Image();
    testImg.onload = () => {
      setPreviewUrl(trimmed);
      setUrlError('');
      setSuccessMessage('Enlace verificado y cargado correctamente.');
    };
    testImg.onerror = () => {
      // Even if direct Image onerror fires (sometimes due to CORS header on public view),
      // we still let the user save it with a friendly hint
      setPreviewUrl(trimmed);
      setUrlError('Aviso: La imagen no pudo previsualizarse directamente (puede deberse a permisos del servidor o enlace de compartir). Si es una URL pública, se guardará igualmente.');
    };
    testImg.src = trimmed;
  };

  const handleSave = () => {
    onSave(previewUrl);
    onClose();
  };

  const handleRemovePhoto = () => {
    setPreviewUrl('');
    setUrlInput('');
    setUrlError('');
    setSuccessMessage('Foto eliminada. Se mostrarán las iniciales del paciente.');
  };

  // Sample presets for quick setup
  const sampleAvatars = [
    { label: 'Foto Carmen', url: '/carmen_avatar.jpg' },
    { label: 'Abuela cálida', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
    { label: 'Abuelo sonriente', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    { label: 'Retrato sereno', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Cambiar Fotografía de {patientName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Selecciona una foto del terminal móvil/PC o introduce un enlace online
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mb-5">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-teal-100 dark:bg-teal-950 border-2 border-teal-500/40 shadow-sm shrink-0 flex items-center justify-center">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt={patientName} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                {patientName?.charAt(0) || 'P'}
              </div>
            )}
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-1 right-1 p-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-lg transition-colors"
                title="Quitar foto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Vista previa actual
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              {previewUrl ? 'Esta imagen se mostrará en la cabecera, el pastillero y los informes.' : 'Sin fotografía personalizada (se muestran iniciales).'}
            </p>
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Quitar foto y usar iniciales</span>
              </button>
            )}
          </div>
        </div>

        {/* Segmented Source Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setActiveSource('device')}
            className={`flex-1 py-2 px-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all min-w-[120px] ${
              activeSource === 'device'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Del Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSource('url')}
            className={`flex-1 py-2 px-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all min-w-[120px] ${
              activeSource === 'url'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Enlace / Fotos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSource('presets')}
            className={`flex-1 sm:flex-none py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeSource === 'presets'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Muestras</span>
          </button>
        </div>

        {/* Tab 1: Device / Terminal Upload */}
        {activeSource === 'device' && (
          <div className="space-y-4">
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging 
                  ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-teal-500/70 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs">
                {isProcessing ? (
                  <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Toca aquí para abrir la galería o hacer una foto
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Accede a las imágenes guardadas en tu teléfono móvil o archivo de tu ordenador.
                </p>
              </div>

              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2 pointer-events-none"
              >
                <Camera className="w-4 h-4" />
                <span>Elegir Foto del Dispositivo</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <Check className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>
                <strong>Optimización automática:</strong> La imagen se comprime de forma segura en tu navegador para que cargue al instante y no ralentice el móvil ni consuma memoria extra.
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Online Link / Google Photos */}
        {activeSource === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Dirección web de la imagen (URL o Google Fotos)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/foto.jpg o enlace de Google Fotos..."
                  className="flex-1 min-w-0 text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shrink-0"
                >
                  Cargar
                </button>
              </div>
            </div>

            {/* Google Photos Instruction Box */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
                <ExternalLink className="w-4 h-4" />
                <span>¿Cómo usar una foto de Google Fotos?</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                <li>Abre la foto en <strong>Google Fotos</strong> (fotos.google.com o en tu app).</li>
                <li>Haz clic derecho sobre la foto (o mantén pulsado en el móvil) y pulsa <strong>&quot;Copiar dirección de la imagen&quot;</strong>.</li>
                <li>Pega ese enlace aquí y pulsa <strong>Cargar</strong>.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 3: Presets */}
        {activeSource === 'presets' && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Selecciona una imagen de ejemplo o plantilla:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sampleAvatars.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPreviewUrl(preset.url);
                    setSuccessMessage(`Imagen seleccionada: ${preset.label}`);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    previewUrl === preset.url
                      ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <img 
                    src={preset.url} 
                    alt={preset.label} 
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {preset.label}
                    </div>
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      {previewUrl === preset.url ? 'Seleccionada' : 'Elegir'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {urlError && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs border border-amber-200 dark:border-amber-900/60 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{urlError}</span>
          </div>
        )}

        {successMessage && !urlError && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Fotografía</span>
          </button>
        </div>

      </div>
    </div>
  );
};
