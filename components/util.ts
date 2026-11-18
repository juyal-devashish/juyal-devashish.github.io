// Small browser helpers shared by the client islands.

/** Copies text; resolves true on success. Falls back to execCommand where the Clipboard API is missing. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

/** Speaks a message through the page-wide polite live region (#announcer, rendered by the layout). */
let announceTimer = 0;
export function announce(msg: string) {
  const el = document.getElementById('announcer');
  if (!el) return;
  el.textContent = '';
  window.clearTimeout(announceTimer);
  announceTimer = window.setTimeout(() => { el.textContent = msg; }, 60);
}

/** True when the key event comes from somewhere the visitor is typing. */
export function isTyping(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  if (t.isContentEditable) return true;
  const tag = t.tagName;
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = (t as HTMLInputElement).type;
    return !['button', 'checkbox', 'radio', 'submit', 'reset', 'range', 'color', 'file'].includes(type);
  }
  return false;
}

export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

// The palette lives in the layout; anything can ask it to open.
export const PALETTE_OPEN = 'site:palette-open';
export const PALETTE_READY = 'site:palette-ready';
export function openPalette() { window.dispatchEvent(new Event(PALETTE_OPEN)); }
export function paletteReady(): boolean { return (window as unknown as { __paletteReady?: boolean }).__paletteReady === true; }
