"use client";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function soundsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("hh-sounds") !== "off";
}

export function setSoundsEnabled(on: boolean) {
  localStorage.setItem("hh-sounds", on ? "on" : "off");
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.15) {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

export function playLog() {
  if (!soundsEnabled()) return;
  tone(660, 0, 0.12, "triangle");
  tone(880, 0.08, 0.15, "triangle");
}

export function playApprove() {
  if (!soundsEnabled()) return;
  tone(523, 0, 0.1, "sine");
  tone(659, 0.09, 0.1, "sine");
  tone(784, 0.18, 0.2, "sine");
}

export function playGoal() {
  if (!soundsEnabled()) return;
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.25, "triangle", 0.18));
}
