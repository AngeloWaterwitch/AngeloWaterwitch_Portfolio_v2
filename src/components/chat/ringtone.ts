'use client';

/**
 * A simple two-tone ring made with the Web Audio API (no audio file needed). Browsers may keep audio silent until the
 * person has interacted with the page, so ringing is always shown visually as well. Also vibrates on phones.
 */
let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let originalTitle: string | null = null;

function beep(freq: number, start: number, dur: number) {
  if (!ctx) return;
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
}

export function startRinging(label = 'Incoming call') {
  if (timer) return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = ctx ?? new AC();
    ctx.resume?.().catch(() => {});
  } catch { /* no audio available */ }

  const ring = () => {
    beep(880, 0, 0.35);
    beep(660, 0.45, 0.35);
    try { navigator.vibrate?.([300, 150, 300]); } catch { /* not supported */ }
  };
  ring();
  timer = setInterval(ring, 2200);

  if (originalTitle === null) originalTitle = document.title;
  let on = false;
  const titleTimer = setInterval(() => { document.title = (on = !on) ? '📞 ' + label : originalTitle ?? ''; }, 1000);
  (timer as any)._title = titleTimer;
}

export function stopRinging() {
  if (timer) {
    clearInterval((timer as any)._title);
    clearInterval(timer);
    timer = null;
  }
  if (originalTitle !== null) { document.title = originalTitle; originalTitle = null; }
  try { navigator.vibrate?.(0); } catch { /* not supported */ }
}
