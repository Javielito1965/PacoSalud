/**
 * Safe browser storage and date/clipboard utilities.
 * Prevents unhandled QuotaExceededError, SecurityError (private mode/WebView),
 * and UTC/local date mismatches when the PWA remains open across midnight.
 */

const memoryFallback = new Map<string, string>();

export function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryFallback.get(key) ?? null;
  }
}

export function safeSetItem(key: string, value: string): { ok: boolean; error?: string } {
  memoryFallback.set(key, value);
  try {
    window.localStorage.setItem(key, value);
    return { ok: true };
  } catch (err: unknown) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      ok: false,
      error: isQuota
        ? 'Memoria del navegador llena (prueba a reducir el tamaño de las fotos o exportar una copia).'
        : 'Almacenamiento local restringido en este navegador; los cambios se mantienen en memoria durante esta sesión.',
    };
  }
}

export function safeClearKeys(keys: string[]): void {
  keys.forEach((key) => {
    memoryFallback.delete(key);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore restricted storage environments
    }
  });
}

export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function safeCopyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to execCommand below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
