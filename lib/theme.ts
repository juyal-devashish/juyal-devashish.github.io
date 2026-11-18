// Theme: follows the system until the visitor picks one; the pick is stored in localStorage('theme').
// The inline script in app/layout.tsx applies a stored pick before first paint.
export type Theme = 'light' | 'dark';
export const THEME_KEY = 'theme';
const EVENT = 'site:theme';

// Runs in <head> before paint. Keep it tiny and dependency-free.
export const themeScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')d.setAttribute('data-theme',t)}catch(e){}})()`;

export function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function setTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: t }));
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

/** Calls fn with the current theme whenever it changes (toggle, other tab, or system change). */
export function onThemeChange(fn: (t: Theme) => void): () => void {
  const run = () => fn(currentTheme());
  const mq = window.matchMedia?.('(prefers-color-scheme: light)');
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    if (e.newValue === 'light' || e.newValue === 'dark') document.documentElement.setAttribute('data-theme', e.newValue);
    else document.documentElement.removeAttribute('data-theme');
    run();
  };
  window.addEventListener(EVENT, run);
  window.addEventListener('storage', onStorage);
  mq?.addEventListener?.('change', run);
  return () => {
    window.removeEventListener(EVENT, run);
    window.removeEventListener('storage', onStorage);
    mq?.removeEventListener?.('change', run);
  };
}

export const themeName = (t: Theme) => (t === 'light' ? 'daybreak' : 'night');
