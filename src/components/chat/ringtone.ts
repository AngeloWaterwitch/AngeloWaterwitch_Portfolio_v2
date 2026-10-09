'use client';

/**
 * A simple two-tone ring made with the Web Audio API (no audio file needed). Browsers may keep audio silent until the
 * person has interacted with the page, so ringing is always shown visually as well. Also vibrates on phones and
 * flashes the tab title. Everything here is best-effort: it must never throw, because it runs inside React effects.
 */
let ctx: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;
let titleTimer: ReturnType<typeof setInterval> | null = null;
let originalTitle: string | null = null;

function beep(freq: number, start: number, dur: number) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.05);
  } catch { /* audio not available */ }
}

export function startRinging(label = 'Incoming call') {
  if (ringTimer) return; // already ringing

  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (AC) {
      ctx = ctx ?? new AC();
      ctx.resume?.().catch(() => {});
    }
  } catch { /* no audio available */ }

  const ring = () => {
    beep(880, 0, 0.35);
    beep(660, 0.45, 0.35);
    try { navigator.vibrate?.([300, 150, 300]); } catch { /* not supported */ }
  };
  ring();
  ringTimer = setInterval(ring, 2200);

  try {
    if (originalTitle === null) originalTitle = document.title;
    let on = false;
    titleTimer = setInterval(() => {
      on = !on;
      document.title = on ? '📞 ' + label : originalTitle ?? '';
    }, 1000);
  } catch { /* no document title */ }
}

/** Stops the sound, the vibration and the title flash, and puts the original tab title back. Safe to call any time. */
export function stopRinging() {
  if (ringTimer) { clearInterval(ringTimer); ringTimer = null; }
  if (titleTimer) { clearInterval(titleTimer); titleTimer = null; }
  try {
    if (originalTitle !== null) { document.title = originalTitle; originalTitle = null; }
  } catch { /* nothing to restore */ }
  try { navigator.vibrate?.(0); } catch { /* not supported */ }
}
