// Interface feedback: tiny synthesized clicks (WebAudio, no files) and short haptic pulses.
// Off by default. Sound plays only when the visitor turned it on, never with
// prefers-reduced-motion, never on touch-only devices. Haptics (navigator.vibrate)
// play only on touch-only devices, and only when feedback is on.
export type SoundRole = 'nav' | 'toggle' | 'open' | 'close' | 'type' | 'error' | 'copy';

export const SOUND_KEY = 'sound';
const EVENT = 'site:sound';

const mq = (q: string) => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches;
export const isTouchOnly = () => mq('(hover: none) and (pointer: coarse)');
const reducedMotion = () => mq('(prefers-reduced-motion: reduce)');

export function soundOn(): boolean {
  try { return localStorage.getItem(SOUND_KEY) === 'on'; } catch { return false; }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: on }));
}
export function onSoundChange(fn: (on: boolean) => void): () => void {
  const run = () => fn(soundOn());
  const onStorage = (e: StorageEvent) => { if (e.key === SOUND_KEY) run(); };
  window.addEventListener(EVENT, run);
  window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(EVENT, run); window.removeEventListener('storage', onStorage); };
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastType = 0;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
    master = ctx.createGain();
    master.gain.value = 0.05; // quiet
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

// One enveloped oscillator: fast attack, exponential decay.
function tone(a: { ctx: AudioContext; out: GainNode }, o: { type?: OscillatorType; f0: number; f1?: number; at?: number; dur: number; vol?: number }) {
  const t = a.ctx.currentTime + (o.at ?? 0);
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f0, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.vol ?? 1, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g).connect(a.out);
  osc.start(t);
  osc.stop(t + o.dur + 0.02);
}

// A filtered noise tick, like a soft key.
function tick(a: { ctx: AudioContext; out: GainNode }, freq: number, dur: number, vol: number) {
  const n = Math.max(1, Math.floor(a.ctx.sampleRate * dur));
  const buf = a.ctx.createBuffer(1, n, a.ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  const bp = a.ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 6;
  const g = a.ctx.createGain(); g.gain.value = vol;
  src.connect(bp).connect(g).connect(a.out);
  src.start();
}

const SOUNDS: Record<SoundRole, (a: { ctx: AudioContext; out: GainNode }) => void> = {
  nav: a => tone(a, { f0: 620, f1: 930, dur: 0.07, vol: 0.8 }),
  toggle: a => { tick(a, 2600, 0.018, 1.4); tone(a, { type: 'triangle', f0: 1180, dur: 0.035, at: 0.012, vol: 0.5 }); },
  open: a => { tone(a, { f0: 420, f1: 780, dur: 0.11, vol: 0.7 }); tone(a, { f0: 1170, dur: 0.06, at: 0.05, vol: 0.25 }); },
  close: a => tone(a, { f0: 700, f1: 360, dur: 0.09, vol: 0.6 }),
  type: a => tick(a, 3400, 0.012, 0.6),
  error: a => { tone(a, { type: 'triangle', f0: 240, dur: 0.08, vol: 0.9 }); tone(a, { type: 'triangle', f0: 180, dur: 0.11, at: 0.09, vol: 0.9 }); },
  copy: a => { tone(a, { f0: 880, dur: 0.06, vol: 0.6 }); tone(a, { f0: 1320, dur: 0.09, at: 0.055, vol: 0.5 }); },
};

const HAPTICS: Partial<Record<SoundRole, number | number[]>> = {
  nav: 8, toggle: 10, open: 12, close: 8, error: [20, 40, 20], copy: [8, 30, 8],
};

/** Plays the feedback for a UI event, if the visitor turned feedback on. Safe to call anywhere. */
export function play(role: SoundRole) {
  if (typeof window === 'undefined' || !soundOn()) return;
  if (isTouchOnly()) {
    const p = HAPTICS[role];
    if (p != null && typeof navigator.vibrate === 'function') { try { navigator.vibrate(p); } catch {} }
    return;
  }
  if (reducedMotion()) return;
  if (role === 'type') { const now = performance.now(); if (now - lastType < 45) return; lastType = now; }
  const a = audio();
  if (!a) return;
  try { SOUNDS[role](a); } catch {}
}
