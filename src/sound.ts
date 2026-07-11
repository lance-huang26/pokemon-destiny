// 用 Web Audio 合成音效，不需外部音檔。首次於使用者點擊時建立 AudioContext。
let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(v: boolean): void {
  muted = v;
}

// 播一段音符序列
function play(notes: { f: number; t: number; d: number; g?: number; type?: OscillatorType }[]): void {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  for (const n of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = n.type ?? "triangle";
    osc.frequency.value = n.f;
    osc.connect(gain);
    gain.connect(c.destination);
    const start = now + n.t;
    const peak = n.g ?? 0.18;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.d);
    osc.start(start);
    osc.stop(start + n.d + 0.02);
  }
}

// 選擇勝出：輕快的兩音
export function playWin(): void {
  play([
    { f: 620, t: 0, d: 0.12 },
    { f: 880, t: 0.07, d: 0.2 },
  ]);
}

// 進入新階段：小號角
export function playStage(): void {
  play([
    { f: 523, t: 0, d: 0.18 },
    { f: 659, t: 0.12, d: 0.18 },
    { f: 784, t: 0.24, d: 0.28 },
  ]);
}

// 冠軍誕生：華麗上行
export function playChampion(): void {
  play([
    { f: 523, t: 0, d: 0.16 },
    { f: 659, t: 0.14, d: 0.16 },
    { f: 784, t: 0.28, d: 0.16 },
    { f: 1046, t: 0.42, d: 0.45, g: 0.22 },
  ]);
}
