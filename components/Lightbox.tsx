'use client';
// Accessible image viewer in a <dialog>. Pages stay server components: render each
// thumbnail as a plain link to the full image (works without JS) and mark it:
//   <a href={full} data-lightbox="photos" data-index={i}>…</a>
// then mount once: <Lightbox group="photos" items={[{ id, src, alt, caption, meta }]} openOnHash />
// Keys: ← → move, + − zoom (0 resets), Esc closes. Swipe on touch, click or double-tap to zoom.
// Focus returns to the link that opened it.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { play } from '@/lib/sound';

export type LightboxItem = { id?: string; src: string; alt: string; caption?: string; meta?: string; width?: number; height?: number };
type Props = { group: string; items: LightboxItem[]; openOnHash?: boolean; label?: string };

const Z = 2.5;

export default function Lightbox({ group, items, openOnHash = false, label = 'Photo viewer' }: Props) {
  const dlg = useRef<HTMLDialogElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const zoomBtn = useRef<HTMLButtonElement>(null);
  const focusView = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const ptr = useRef<{ x: number; y: number; t: number; type: string } | null>(null);
  const lastTap = useRef<{ x: number; y: number; t: number } | null>(null);
  const zoomTarget = useRef<{ fx: number; fy: number; w: number; h: number } | null>(null);

  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ w: number; h: number } | null>(null);
  const n = items.length;
  const item = items[index];

  const show = useCallback((i: number, from?: HTMLElement | null) => {
    const d = dlg.current;
    if (!d || !items[i]) return;
    setIndex(i);
    setZoom(null);
    if (!d.open) {
      opener.current = from ?? (document.activeElement as HTMLElement | null);
      d.showModal();
      closeBtn.current?.focus();
      play('open');
    }
  }, [items]);

  const move = useCallback((step: number) => {
    if (n < 2) return;
    setIndex(i => (i + step + n) % n);
    setZoom(null);
    play('nav');
  }, [n]);

  // Zoom around a point (client coordinates), or the centre.
  const zoomIn = useCallback((cx?: number, cy?: number) => {
    const im = img.current;
    if (!im) return;
    const r = im.getBoundingClientRect();
    const fx = cx == null ? 0.5 : Math.min(1, Math.max(0, (cx - r.left) / r.width));
    const fy = cy == null ? 0.5 : Math.min(1, Math.max(0, (cy - r.top) / r.height));
    zoomTarget.current = { fx, fy, w: r.width * Z, h: r.height * Z };
    setZoom({ w: r.width * Z, h: r.height * Z });
    play('toggle');
  }, []);
  const zoomOut = useCallback(() => {
    setZoom(null); play('toggle');
    // the view stops being focusable when zoomed out; keep focus inside the dialog
    if (document.activeElement === view.current) zoomBtn.current?.focus();
  }, []);

  useLayoutEffect(() => {
    const v = view.current, z = zoomTarget.current;
    if (!v || !zoom || !z) return;
    v.scrollLeft = z.fx * z.w - v.clientWidth / 2;
    v.scrollTop = z.fy * z.h - v.clientHeight / 2;
    zoomTarget.current = null;
    // keyboard zoom: focus the view so arrow keys pan it
    if (focusView.current) { focusView.current = false; v.focus({ preventScroll: true }); }
  }, [zoom]);

  // Preload neighbours.
  useEffect(() => {
    if (!dlg.current?.open || n < 2) return;
    [items[(index + 1) % n], items[(index - 1 + n) % n]].forEach(it => { const im = new Image(); im.src = it.src; });
  }, [index, items, n]);

  // Triggers: any [data-lightbox=group][data-index] link or button.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const t = (e.target as Element | null)?.closest?.<HTMLElement>(`[data-lightbox="${CSS.escape(group)}"]`);
      if (!t) return;
      const i = Number(t.dataset.index);
      if (!Number.isInteger(i) || !items[i]) return;
      e.preventDefault();
      show(i, t);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [group, items, show]);

  // Deep links: /photos#img_0510 opens that photo.
  useEffect(() => {
    if (!openOnHash) return;
    const check = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id) return;
      const i = items.findIndex(it => it.id === id);
      if (i < 0) return;
      const target = document.querySelector<HTMLElement>(`[data-lightbox="${CSS.escape(group)}"][data-index="${i}"]`) ?? document.getElementById(id);
      show(i, target);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [openOnHash, items, group, show]);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    const onClose = () => {
      setZoom(null);
      play('close');
      const o = opener.current;
      if (o && document.contains(o)) o.focus({ preventScroll: true });
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight' && !zoom) { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowLeft' && !zoom) { e.preventDefault(); move(-1); }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); if (!zoom) { focusView.current = true; zoomIn(); } }
    else if (e.key === '-' || e.key === '_' || e.key === '0') { e.preventDefault(); if (zoom) zoomOut(); }
  }

  function onPointerDown(e: React.PointerEvent) {
    ptr.current = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
  }
  function onPointerUp(e: React.PointerEvent) {
    const p = ptr.current; ptr.current = null;
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    const onImg = e.target === img.current;
    if (!zoom && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { move(dx < 0 ? 1 : -1); return; }
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) return; // a drag or scroll, not a tap
    if (p.type === 'mouse') {
      if (onImg) { if (zoom) zoomOut(); else zoomIn(e.clientX, e.clientY); }
      else if (!zoom) dlg.current?.close();
      return;
    }
    // touch / pen: double-tap toggles zoom
    const now = performance.now(), last = lastTap.current;
    if (last && now - last.t < 320 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
      lastTap.current = null;
      if (zoom) zoomOut(); else zoomIn(e.clientX, e.clientY);
    } else lastTap.current = { x: e.clientX, y: e.clientY, t: now };
  }

  if (!n) return null;

  return (
    <dialog ref={dlg} id="lightbox" className="lightbox" aria-label={label} onKeyDown={onKeyDown}>
      <div className="lb-top">
        <span className="lb-count" aria-hidden="true">{index + 1} / {n}</span>
        <div className="lb-tools">
          <button ref={zoomBtn} type="button" className="lb-btn" aria-label="Zoom" aria-pressed={!!zoom} aria-keyshortcuts="+ -" onClick={() => (zoom ? zoomOut() : zoomIn())}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" />{zoom ? <path d="M8 11h6" /> : <path d="M8 11h6M11 8v6" />}</svg>
            <span className="lb-zoom-lbl" aria-hidden="true">Zoom</span>
          </button>
          <button ref={closeBtn} type="button" className="lb-btn" onClick={() => dlg.current?.close()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            Close
          </button>
        </div>
      </div>
      <div className="lb-stage">
        <button type="button" className="lb-btn" aria-label="Previous photo" aria-keyshortcuts="ArrowLeft" disabled={n < 2} onClick={() => move(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <div
          ref={view}
          className={`lb-view${zoom ? ' zoomed' : ''}`}
          // zoomed: a focusable scroll area, arrow keys pan
          tabIndex={zoom ? 0 : undefined}
          role={zoom ? 'region' : undefined}
          aria-label={zoom ? 'Zoomed photo. Arrow keys pan.' : undefined}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {item && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={img}
              id="lb-img"
              key={item.src}
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              draggable={false}
              style={zoom ? { width: zoom.w, height: zoom.h, margin: 'auto' } : undefined}
            />
          )}
        </div>
        <button type="button" className="lb-btn" aria-label="Next photo" aria-keyshortcuts="ArrowRight" disabled={n < 2} onClick={() => move(1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <p className="lb-cap" aria-live="polite">
        <b id="lb-cap">{item?.caption ?? ''}</b>
        <span className="vh">Photo {index + 1} of {n}. </span>
        {item?.meta ?? ''}
      </p>
    </dialog>
  );
}
