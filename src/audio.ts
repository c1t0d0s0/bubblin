// Frequencies for musical notes
const F: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98
};

// 16 bars chord progression (C Major / A Minor pop)
const CHORDS: Array<{ bass: number; arp: number[] }> = [
  // Verse A (Bars 0-3)
  { bass: F.C2, arp: [F.C4, F.E4, F.G4, F.C5] }, // 0: C
  { bass: F.G2, arp: [F.G3, F.B3, F.D4, F.G4] }, // 1: G
  { bass: F.A2, arp: [F.A3, F.C4, F.E4, F.A4] }, // 2: Am
  { bass: F.F2, arp: [F.F3, F.A3, F.C4, F.F4] }, // 3: F
  // Verse B (Bars 4-7)
  { bass: F.C2, arp: [F.C4, F.E4, F.G4, F.C5] }, // 4: C
  { bass: F.E2, arp: [F.E3, F.G3, F.B3, F.E4] }, // 5: Em
  { bass: F.F2, arp: [F.F3, F.A3, F.C4, F.F4] }, // 6: F
  { bass: F.G2, arp: [F.G3, F.B3, F.D4, F.G4] }, // 7: G
  // Chorus A (Bars 8-11)
  { bass: F.F2, arp: [F.F3, F.A3, F.C4, F.F4] }, // 8: F
  { bass: F.G2, arp: [F.G3, F.B3, F.D4, F.G4] }, // 9: G
  { bass: F.E2, arp: [F.E3, F.G3, F.B3, F.E4] }, // 10: Em
  { bass: F.A2, arp: [F.A3, F.C4, F.E4, F.A4] }, // 11: Am
  // Chorus B (Bars 12-15)
  { bass: F.D2, arp: [F.D3, F.F3, F.A3, F.D4] }, // 12: Dm
  { bass: F.G2, arp: [F.G3, F.B3, F.D4, F.G4] }, // 13: G
  { bass: F.C2, arp: [F.C4, F.E4, F.G4, F.C5] }, // 14: C
  { bass: F.G2, arp: [F.G3, F.B3, F.D4, F.F4] }  // 15: G7
];

// Lead melody notes scheduled at step indices (0 to 255)
const MELODY: Record<number, { freq: number; len: number }> = {
  // Bar 0
  0: { freq: F.E5, len: 2 },
  3: { freq: F.G5, len: 3 },
  6: { freq: F.A5, len: 2 },
  8: { freq: F.G5, len: 4 },
  12: { freq: F.E5, len: 4 },
  // Bar 1
  16: { freq: F.D5, len: 4 },
  20: { freq: F.C5, len: 4 },
  24: { freq: F.D5, len: 4 },
  28: { freq: F.E5, len: 4 },
  // Bar 2
  32: { freq: F.E5, len: 2 },
  35: { freq: F.G5, len: 3 },
  38: { freq: F.C6, len: 4 },
  42: { freq: F.B5, len: 2 },
  44: { freq: F.A5, len: 4 },
  // Bar 3
  48: { freq: F.G5, len: 6 },
  56: { freq: F.F5, len: 4 },
  60: { freq: F.E5, len: 4 },
  // Bar 4
  64: { freq: F.E5, len: 3 },
  68: { freq: F.F5, len: 2 },
  70: { freq: F.G5, len: 4 },
  74: { freq: F.A5, len: 3 },
  78: { freq: F.G5, len: 3 },
  // Bar 5
  82: { freq: F.E5, len: 4 },
  86: { freq: F.D5, len: 4 },
  90: { freq: F.C5, len: 6 },
  // Bar 6
  96: { freq: F.D5, len: 3 },
  100: { freq: F.E5, len: 3 },
  104: { freq: F.F5, len: 4 },
  108: { freq: F.G5, len: 4 },
  // Bar 7
  112: { freq: F.G5, len: 8 },
  120: { freq: F.B5, len: 4 },
  124: { freq: F.D6, len: 4 },
  // Bar 8 (Chorus)
  128: { freq: F.C6, len: 4 },
  132: { freq: F.B5, len: 2 },
  134: { freq: F.A5, len: 4 },
  138: { freq: F.G5, len: 4 },
  142: { freq: F.A5, len: 2 },
  // Bar 9
  144: { freq: F.B5, len: 4 },
  148: { freq: F.C6, len: 4 },
  152: { freq: F.D6, len: 6 },
  // Bar 10
  160: { freq: F.B5, len: 4 },
  164: { freq: F.A5, len: 2 },
  166: { freq: F.G5, len: 4 },
  170: { freq: F.E5, len: 4 },
  174: { freq: F.G5, len: 2 },
  // Bar 11
  176: { freq: F.A5, len: 8 },
  184: { freq: F.B5, len: 4 },
  188: { freq: F.C6, len: 4 },
  // Bar 12
  192: { freq: F.F5, len: 3 },
  196: { freq: F.G5, len: 3 },
  200: { freq: F.A5, len: 4 },
  204: { freq: F.G5, len: 3 },
  207: { freq: F.F5, len: 3 },
  // Bar 13
  210: { freq: F.D5, len: 6 },
  216: { freq: F.E5, len: 2 },
  218: { freq: F.F5, len: 2 },
  220: { freq: F.G5, len: 4 },
  // Bar 14
  224: { freq: F.C5, len: 3 },
  228: { freq: F.E5, len: 3 },
  232: { freq: F.G5, len: 4 },
  236: { freq: F.C6, len: 6 },
  // Bar 15 (Turnaround)
  242: { freq: F.B5, len: 2 },
  244: { freq: F.A5, len: 2 },
  246: { freq: F.G5, len: 4 },
  250: { freq: F.D5, len: 3 },
  253: { freq: F.E5, len: 3 }
};

class BgmSequencer {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private isDucked: boolean = false;
  private timerId: number | null = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;

  private secondsPerStep: number = 60 / (128 * 4); // ~0.117s (128 BPM, 16th notes)
  private noiseBuffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext, isMuted: boolean = false) {
    this.ctx = ctx;
    this.isMuted = isMuted;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.14, ctx.currentTime);
    this.masterGain.connect(ctx.destination);
  }

  private getNoiseBuffer(): AudioBuffer {
    if (!this.noiseBuffer) {
      const size = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < size; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return this.noiseBuffer;
  }

  public start(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    // Start lookahead scheduler
    this.timerId = window.setInterval(() => this.scheduler(), 25);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    const targetVol = this.isMuted ? 0 : (this.isDucked ? 0.025 : 0.14);
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.1);
  }

  public setDucking(ducked: boolean): void {
    this.isDucked = ducked;
    if (this.isMuted) return;
    const targetVol = this.isDucked ? 0.025 : 0.14;
    this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.25);
  }

  private scheduler(): void {
    // Schedule ahead up to 100ms
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.nextNoteTime += this.secondsPerStep;
      this.currentStep = (this.currentStep + 1) % 256;
    }
  }

  private scheduleStep(step: number, time: number): void {
    const barIndex = Math.floor(step / 16) % CHORDS.length;
    const barStep = step % 16;
    const chord = CHORDS[barIndex];

    // 1. DRUMS
    // Kick on beats 1 and 3 (and syncopation on beat 4.5 in Chorus)
    const isChorus = barIndex >= 8;
    const isKick = barStep === 0 || barStep === 8 || (isChorus && (barStep === 6 || barStep === 14));
    if (isKick) {
      this.playKick(time);
    }

    // Snare on beats 2 and 4
    if (barStep === 4 || barStep === 12) {
      this.playSnare(time);
    }

    // Hi-Hat on upbeat 8ths and 16ths
    if (barStep % 2 === 0 || barStep === 15) {
      this.playHiHat(time, barStep % 4 === 2 ? 0.05 : 0.025);
    }

    // 2. BASSLINE (Walking syncopated bass)
    if ([0, 4, 6, 8, 10, 12, 14].includes(barStep)) {
      let bassFreq = chord.bass;
      if (barStep === 4 || barStep === 12) {
        bassFreq *= 2; // octave bounce
      } else if (barStep === 6 || barStep === 14) {
        bassFreq *= 1.5; // fifth bounce
      }
      this.playBassNote(bassFreq, time, this.secondsPerStep * 1.6);
    }

    // 3. BUBBLE ARP (Chiptune bubble chimes)
    if (barStep % 2 === 0) {
      const arpNote = chord.arp[(barStep / 2) % chord.arp.length];
      this.playArpNote(arpNote, time, this.secondsPerStep * 1.5);
    }

    // 4. LEAD MELODY
    const melodyEntry = MELODY[step];
    if (melodyEntry) {
      this.playLeadNote(melodyEntry.freq, time, melodyEntry.len * this.secondsPerStep);
    }
  }

  private playKick(time: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, time);
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  private playSnare(time: number): void {
    // Noise snap
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2200, time);
    noiseFilter.Q.setValueAtTime(1.5, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.12);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(90, time + 0.06);

    oscGain.gain.setValueAtTime(0.18, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  private playHiHat(time: number, vol: number): void {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.035);
  }

  private playBassNote(freq: number, time: number, duration: number): void {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(360, time);
    filter.Q.setValueAtTime(2.0, time);

    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playArpNote(freq: number, time: number, duration: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playLeadNote(freq: number, time: number, duration: number): void {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Dual square with subtle chorus
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.002, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.Q.setValueAtTime(2.0, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.13, time + 0.02);
    gain.gain.setValueAtTime(0.11, time + duration - 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(time);
    osc2.start(time);

    osc1.stop(time + duration);
    osc2.stop(time + duration);
  }
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private isSeMuted: boolean = false;
  private isBgmMuted: boolean = false;
  private bgmSequencer: BgmSequencer | null = null;
  private lastBounceTime: number = 0;
  private lastSplashTime: number = 0;

  constructor() {
    // Check saved mute states
    const savedSe = localStorage.getItem('bubblin_se_muted');
    if (savedSe !== null) {
      this.isSeMuted = savedSe === 'true';
    } else {
      // Fallback to legacy key
      const legacy = localStorage.getItem('bubblin_muted');
      if (legacy !== null) {
        this.isSeMuted = legacy === 'true';
      }
    }

    const savedBgm = localStorage.getItem('bubblin_bgm_muted');
    if (savedBgm !== null) {
      this.isBgmMuted = savedBgm === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.bgmSequencer = new BgmSequencer(this.ctx, this.isBgmMuted);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // BGM Controls
  public startBgm(): void {
    const ctx = this.initCtx();
    if (!ctx || !this.bgmSequencer) return;
    this.bgmSequencer.start();
  }

  public stopBgm(): void {
    this.bgmSequencer?.stop();
  }

  public setBgmDucking(isDucked: boolean): void {
    this.bgmSequencer?.setDucking(isDucked);
  }

  public toggleBgm(): boolean {
    this.isBgmMuted = !this.isBgmMuted;
    localStorage.setItem('bubblin_bgm_muted', String(this.isBgmMuted));
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.bgmSequencer) {
      this.bgmSequencer.setMuted(this.isBgmMuted);
    }
    return this.isBgmMuted;
  }

  public getBgmMuted(): boolean {
    return this.isBgmMuted;
  }

  // SE Controls
  public toggleSe(): boolean {
    this.isSeMuted = !this.isSeMuted;
    localStorage.setItem('bubblin_se_muted', String(this.isSeMuted));
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.isSeMuted;
  }

  public getSeMuted(): boolean {
    return this.isSeMuted;
  }

  // Legacy aliases
  public toggleMute(): boolean {
    return this.toggleSe();
  }

  public getMuted(): boolean {
    return this.getSeMuted();
  }

  // Sound Effects
  public playShoot(): void {
    if (this.isSeMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playBounce(): void {
    if (this.isSeMuted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastBounceTime < 60) return;
    this.lastBounceTime = nowMs;

    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playSnap(): void {
    if (this.isSeMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playPop(combo: number = 1): void {
    if (this.isSeMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const baseIndex = Math.min(combo - 1, scale.length - 1);
    const freq = scale[Math.max(0, baseIndex)];

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.1);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc2.frequency.exponentialRampToValueAtTime(freq, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.18);
    osc2.stop(now + 0.18);
  }

  public playHeavyThud(): void {
    if (this.isSeMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playBubbleSplash(): void {
    if (this.isSeMuted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSplashTime < 35) return;
    this.lastSplashTime = nowMs;

    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const freqs = [659.25, 783.99, 880, 1046.5, 1318.5];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playDrop(count: number): void {
    if (this.isSeMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (count >= 3) {
      this.playHeavyThud();
    }

    const scale = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
    const totalNotes = Math.min(Math.max(count * 2, 5), 14);

    for (let i = 0; i < totalNotes; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const noteTime = now + 0.04 + i * 0.042;
      const freq = scale[i % scale.length] * (1 + Math.floor(i / scale.length) * 0.5);

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, noteTime + 0.12);

      const noteVol = Math.min(0.25, 0.12 + count * 0.01);
      gain.gain.setValueAtTime(noteVol, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.13);
    }
  }

  public playWarning(): void {
    if (this.isSeMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.15);
    osc.frequency.linearRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  private playBrassVoice(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    volume: number = 0.18,
    hasVibrato: boolean = false
  ): void {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.003, startTime);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.6, startTime);

    const peakCutoff = Math.min(6500, freq * 4.2);
    const sustainCutoff = Math.min(4200, freq * 2.6);
    filter.frequency.setValueAtTime(850, startTime);
    filter.frequency.exponentialRampToValueAtTime(peakCutoff, startTime + 0.035);
    filter.frequency.exponentialRampToValueAtTime(sustainCutoff, startTime + 0.12);

    if (hasVibrato && duration > 0.3) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.4, startTime);
      lfoGain.gain.setValueAtTime(0, startTime);
      lfoGain.gain.setValueAtTime(0, startTime + 0.18);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.012, startTime + 0.45);

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      lfo.start(startTime);
      lfo.stop(startTime + duration);
    }

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.022);
    gain.gain.setValueAtTime(volume * 0.88, startTime + 0.07);
    gain.gain.setValueAtTime(volume * 0.85, startTime + Math.max(0.08, duration - 0.05));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    subOsc.start(startTime);

    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
    subOsc.stop(startTime + duration);
  }

  public playStageClear(): void {
    if (this.isSeMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Triple-tongue trumpet pickup
    const G4 = 392.0;
    this.playBrassVoice(ctx, G4, now + 0.0, 0.07, 0.09, false);
    this.playBrassVoice(ctx, G4, now + 0.08, 0.07, 0.09, false);
    this.playBrassVoice(ctx, G4, now + 0.16, 0.07, 0.1, false);

    // 2. Ascending heroic brass phrase
    const C5 = 523.25;
    const E5 = 659.25;
    const G5 = 783.99;
    const E4 = 329.63;

    this.playBrassVoice(ctx, C5, now + 0.26, 0.13, 0.1, false);
    this.playBrassVoice(ctx, E4, now + 0.26, 0.13, 0.06, false);

    this.playBrassVoice(ctx, E5, now + 0.4, 0.13, 0.1, false);
    this.playBrassVoice(ctx, G4, now + 0.4, 0.13, 0.06, false);

    this.playBrassVoice(ctx, G5, now + 0.54, 0.15, 0.11, false);
    this.playBrassVoice(ctx, C5, now + 0.54, 0.15, 0.07, false);

    this.playBrassVoice(ctx, E5, now + 0.7, 0.12, 0.09, false);
    this.playBrassVoice(ctx, C5, now + 0.7, 0.12, 0.06, false);

    this.playBrassVoice(ctx, G5, now + 0.83, 0.25, 0.12, false);
    this.playBrassVoice(ctx, E5, now + 0.83, 0.25, 0.07, false);

    // 3. Grand Triumphant Full Brass Chord Hold
    const chordTime = now + 1.12;
    const chordDuration = 1.15;

    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(120, chordTime);
    kickOsc.frequency.exponentialRampToValueAtTime(40, chordTime + 0.25);
    kickGain.gain.setValueAtTime(0.12, chordTime);
    kickGain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.28);
    kickOsc.connect(kickGain);
    kickGain.connect(ctx.destination);
    kickOsc.start(chordTime);
    kickOsc.stop(chordTime + 0.28);

    const C3 = 130.81;
    const C4 = 261.63;
    const C6 = 1046.5;

    this.playBrassVoice(ctx, C3, chordTime, chordDuration, 0.07, true);
    this.playBrassVoice(ctx, C4, chordTime, chordDuration, 0.06, true);
    this.playBrassVoice(ctx, E4, chordTime, chordDuration, 0.05, true);
    this.playBrassVoice(ctx, G4, chordTime, chordDuration, 0.05, true);
    this.playBrassVoice(ctx, C5, chordTime, chordDuration, 0.08, true);
    this.playBrassVoice(ctx, E5, chordTime, chordDuration, 0.06, true);
    this.playBrassVoice(ctx, C6, chordTime, chordDuration, 0.045, true);
  }

  public playGameOver(): void {
    if (this.isSeMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [440, 415.3, 392, 349.23];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.18;
      const duration = idx === notes.length - 1 ? 0.6 : 0.25;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration);
    });
  }
}

export const soundManager = new SoundManager();
