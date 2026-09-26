/**
 * 90s Arcade Retro Sound Synthesizer using Web Audio API
 * Provides nostalgic 8-bit/16-bit sound effects (Coin, Blip, Victory, Error)
 * Zero external audio files required - 100% synthesized in-browser with zero latency.
 */

const SOUNDS_STORAGE_KEY = 'eco_arcade_sounds_enabled';

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Checks whether global arcade sound effects are enabled.
 * Defaults to true.
 */
export const isSoundsEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(SOUNDS_STORAGE_KEY);
    return saved !== null ? saved === 'true' : true;
  } catch {
    return true;
  }
};

/**
 * Persists the global sound effect toggle state.
 */
export const setSoundsEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUNDS_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
};

/**
 * Plays nostalgic 90s arcade "Coin" sound.
 * Classic two-tone chiptune frequency jump: B5 (987.8 Hz) -> E6 (1318.5 Hz).
 */
export const playCoinSound = (): void => {
  if (!isSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // First Tone: B5 (987.77 Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(987.77, now);

  gain1.gain.setValueAtTime(0.25, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.08);

  // Second Tone: E6 (1318.51 Hz) with bright chime sustain
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(1318.51, now + 0.08);

  gain2.gain.setValueAtTime(0.3, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.45);
};

/**
 * Plays a snappy 90s arcade "Blip" / "Chirp" UI sound.
 * Quick frequency swipe 650Hz -> 1100Hz with fast square wave attack.
 */
export const playBlipSound = (): void => {
  if (!isSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(650, now);
  osc.frequency.exponentialRampToValueAtTime(1150, now + 0.06);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.07);
};

/**
 * Plays a triumphant 90s arcade Victory fanfare arpeggio:
 * C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz).
 */
export const playVictorySound = (): void => {
  if (!isSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const startTime = now + idx * 0.09;
    const isLast = idx === notes.length - 1;
    const duration = isLast ? 0.35 : 0.08;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  });
};

/**
 * Plays retro 90s error buzz sound.
 */
export const playErrorSound = (): void => {
  if (!isSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
};
