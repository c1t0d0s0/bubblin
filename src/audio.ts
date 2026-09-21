// Frequencies for musical notes
const F: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98
};

// Light, rhythmic BGM: mid-fast tempo, soft drums, plucky voices kept at a low level (16 bars, 256 sixteenth-note steps)
const BGM_VOLUME = 0.11;
const BGM_DUCKED_VOLUME = 0.02;
const BGM_BPM = 112;

// 16 bars chord progression (C Major / A Minor)
const CHORDS: Array<{ bass: number; pad: number[]; arp: number[] }> = [
  // Verse A (Bars 0-3)
  { bass: F.C2, pad: [F.E3, F.G3, F.C4], arp: [F.C4, F.E4, F.G4, F.E4] }, // 0: C
  { bass: F.G2, pad: [F.G3, F.B3, F.D4], arp: [F.D4, F.G4, F.B4, F.G4] }, // 1: G
  { bass: F.A2, pad: [F.E3, F.A3, F.C4], arp: [F.A3, F.C4, F.E4, F.C4] }, // 2: Am
  { bass: F.F2, pad: [F.F3, F.A3, F.C4], arp: [F.A3, F.C4, F.F4, F.C4] }, // 3: F
  // Verse B (Bars 4-7)
  { bass: F.C2, pad: [F.E3, F.G3, F.C4], arp: [F.C4, F.E4, F.G4, F.E4] }, // 4: C
  { bass: F.E2, pad: [F.E3, F.G3, F.B3], arp: [F.E4, F.G4, F.B4, F.G4] }, // 5: Em
  { bass: F.F2, pad: [F.F3, F.A3, F.C4], arp: [F.A3, F.C4, F.F4, F.C4] }, // 6: F
  { bass: F.G2, pad: [F.G3, F.B3, F.D4], arp: [F.D4, F.G4, F.B4, F.G4] }, // 7: G
  // Chorus A (Bars 8-11)
  { bass: F.F2, pad: [F.F3, F.A3, F.C4], arp: [F.A3, F.C4, F.F4, F.C4] }, // 8: F
  { bass: F.G2, pad: [F.G3, F.B3, F.D4], arp: [F.D4, F.G4, F.B4, F.G4] }, // 9: G
  { bass: F.E2, pad: [F.E3, F.G3, F.B3], arp: [F.E4, F.G4, F.B4, F.G4] }, // 10: Em
  { bass: F.A2, pad: [F.E3, F.A3, F.C4], arp: [F.A3, F.C4, F.E4, F.C4] }, // 11: Am
  // Chorus B (Bars 12-15)
  { bass: F.D2, pad: [F.F3, F.A3, F.D4], arp: [F.D4, F.F4, F.A4, F.F4] }, // 12: Dm
  { bass: F.G2, pad: [F.G3, F.B3, F.D4], arp: [F.D4, F.G4, F.B4, F.G4] }, // 13: G
  { bass: F.C2, pad: [F.E3, F.G3, F.C4], arp: [F.C4, F.E4, F.G4, F.E4] }, // 14: C
  { bass: F.G2, pad: [F.G3, F.B3, F.D4], arp: [F.D4, F.G4, F.B4, F.G4] }  // 15: G
];

// Syncopated lead phrases per bar: [step within the bar, note, length in steps]
const MELODY_BARS: Array<Array<[number, number, number]>> = [
  // Verse A
  [[0, F.E5, 2], [3, F.G5, 2], [6, F.E5, 2], [8, F.D5, 2], [10, F.E5, 3], [14, F.C5, 2]], // C
  [[0, F.D5, 2], [3, F.G5, 2], [6, F.D5, 2], [8, F.B4, 2], [10, F.D5, 3], [14, F.B4, 2]], // G
  [[0, F.C5, 2], [3, F.E5, 2], [6, F.A5, 2], [8, F.G5, 2], [10, F.E5, 3], [14, F.C5, 2]], // Am
  [[0, F.A4, 2], [3, F.C5, 2], [6, F.F5, 2], [8, F.E5, 2], [10, F.C5, 3], [14, F.A4, 2]], // F
  // Verse B
  [[0, F.E5, 2], [3, F.G5, 2], [6, F.C6, 2], [8, F.B5, 2], [10, F.G5, 3], [14, F.E5, 2]], // C
  [[0, F.G5, 2], [3, F.E5, 2], [6, F.B4, 2], [8, F.E5, 2], [10, F.G5, 3], [14, F.E5, 2]], // Em
  [[0, F.A5, 2], [3, F.F5, 2], [6, F.C5, 2], [8, F.F5, 2], [10, F.A5, 3], [14, F.F5, 2]], // F
  [[0, F.G5, 2], [3, F.D5, 2], [6, F.B4, 2], [8, F.D5, 2], [10, F.G5, 4], [14, F.D5, 2]], // G
  // Chorus A
  [[0, F.C6, 2], [3, F.A5, 2], [6, F.F5, 2], [8, F.A5, 2], [10, F.C6, 3], [14, F.A5, 2]], // F
  [[0, F.B5, 2], [3, F.G5, 2], [6, F.D5, 2], [8, F.G5, 2], [10, F.B5, 3], [14, F.D6, 2]], // G
  [[0, F.B5, 2], [3, F.G5, 2], [6, F.E5, 2], [8, F.G5, 2], [10, F.B5, 3], [14, F.G5, 2]], // Em
  [[0, F.A5, 2], [3, F.E5, 2], [6, F.C5, 2], [8, F.E5, 2], [10, F.A5, 3], [14, F.C6, 2]], // Am
  // Chorus B
  [[0, F.D5, 2], [3, F.F5, 2], [6, F.A5, 2], [8, F.F5, 2], [10, F.D5, 3], [14, F.A4, 2]], // Dm
  [[0, F.G5, 2], [3, F.B5, 2], [6, F.D6, 2], [8, F.B5, 2], [10, F.G5, 3], [14, F.D5, 2]], // G
  [[0, F.E5, 2], [3, F.G5, 2], [6, F.C6, 2], [8, F.G5, 2], [10, F.E5, 3], [14, F.C5, 2]], // C
  [[0, F.D5, 2], [3, F.G5, 2], [6, F.B5, 2], [8, F.A5, 2], [10, F.G5, 3], [14, F.E5, 2]]  // G (turnaround)
];

const MELODY: Record<number, { freq: number; len: number }> = {};
MELODY_BARS.forEach((bar, barIndex) => {
  for (const [offset, freq, len] of bar) {
    MELODY[barIndex * 16 + offset] = { freq, len };
  }
});

class BgmSequencer {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private bus: GainNode; // all voices go through here (dry + soft echo)
  private isPlaying: boolean = false;
  private isMuted: boolean = false;
  private isDucked: boolean = false;
  private timerId: number | null = null;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;

  private secondsPerStep: number = 60 / (BGM_BPM * 4); // 16th notes
  private noiseBuffer: AudioBuffer | null = null;

  constructor(ctx: AudioContext, isMuted: boolean = false) {
    this.ctx = ctx;
    this.isMuted = isMuted;

    this.masterGain = ctx.createGain();
    const initVol = this.isMuted ? 0 : BGM_VOLUME;
    this.masterGain.gain.setValueAtTime(initVol, ctx.currentTime);
    this.masterGain.gain.value = initVol;
    this.masterGain.connect(ctx.destination);

    // Soft echo for a spacious, calm feel
    this.bus = ctx.createGain();
    this.bus.connect(this.masterGain);
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = this.secondsPerStep * 3; // dotted-eighth echo
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 1800;
    this.bus.connect(delay);
    delay.connect(damp);
    damp.connect(feedback);
    feedback.connect(delay);
    damp.connect(wet);
    wet.connect(this.masterGain);
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
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);

    if (this.isMuted) {
      // Immediate absolute silence
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.value = 0;
    } else {
      const targetVol = this.isDucked ? BGM_DUCKED_VOLUME : BGM_VOLUME;
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(targetVol, now + 0.1);
    }
  }

  public setDucking(ducked: boolean): void {
    this.isDucked = ducked;
    const now = this.ctx.currentTime;

    if (this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.value = 0;
      return;
    }

    const targetVol = this.isDucked ? BGM_DUCKED_VOLUME : BGM_VOLUME;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(targetVol, now + 0.25);
  }

  private scheduler(): void {
    // Schedule ahead up to 100ms
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      // If muted, advance step clock in sync but don't schedule audio nodes
      if (!this.isMuted) {
        this.scheduleStep(this.currentStep, this.nextNoteTime);
      }
      this.nextNoteTime += this.secondsPerStep;
      this.currentStep = (this.currentStep + 1) % 256;
    }
  }

  private scheduleStep(step: number, time: number): void {
    const barIndex = Math.floor(step / 16) % CHORDS.length;
    const barStep = step % 16;
    const chord = CHORDS[barIndex];
    const barSeconds = this.secondsPerStep * 16;
    const isChorus = barIndex >= 8;

    // 1. SOFT DRUMS
    if (barStep === 0 || barStep === 8 || (isChorus && barStep === 10)) {
      this.playKick(time);
    }
    if (barStep === 4 || barStep === 12) {
      this.playRim(time);
    }
    if (barStep % 2 === 0) {
      this.playHiHat(time, barStep % 4 === 2 ? 0.018 : 0.009);
    }

    // 2. PAD: one soft sustained chord per bar
    if (barStep === 0) {
      for (const freq of chord.pad) this.playPadNote(freq, time, barSeconds);
    }

    // 3. BASS: bouncy syncopated line
    const bassPattern: Record<number, number> = { 0: 1, 3: 1, 6: 1.5, 8: 1, 11: 1, 14: 1.5 };
    if (barStep in bassPattern) {
      this.playBassNote(chord.bass * bassPattern[barStep], time, this.secondsPerStep * 2.4);
    }

    // 4. ARP: plucky eighth notes
    if (barStep % 2 === 0) {
      this.playArpNote(chord.arp[(barStep / 2) % chord.arp.length], time, this.secondsPerStep * 2.2);
    }

    // 5. LEAD MELODY
    const melodyEntry = MELODY[step];
    if (melodyEntry) {
      this.playLeadNote(melodyEntry.freq, time, melodyEntry.len * this.secondsPerStep);
    }
  }

  private playKick(time: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.09);

    gain.gain.setValueAtTime(0.09, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.11);
  }

  private playRim(time: number): void {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, time);
    filter.Q.setValueAtTime(2.0, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.03, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.07);
  }

  private playHiHat(time: number, vol: number): void {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
    noise.stop(time + 0.035);
  }

  private playPadNote(freq: number, time: number, duration: number): void {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);

    // Slow swell in and out
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.055, time + duration * 0.3);
    gain.gain.linearRampToValueAtTime(0.0001, time + duration + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bus);

    osc.start(time);
    osc.stop(time + duration + 0.45);
  }

  private playBassNote(freq: number, time: number, duration: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.13, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.bus);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playArpNote(freq: number, time: number, duration: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.065, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.bus);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playLeadNote(freq: number, time: number, duration: number): void {
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Soft sine + faint triangle an octave up, slightly detuned
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, time);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.003, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration + 0.12);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.bus);

    osc1.start(time);
    osc2.start(time);

    osc1.stop(time + duration + 0.15);
    osc2.stop(time + duration + 0.15);
  }
}

// Stage-clear fanfare level relative to its original loudness (kept well below the old, too-loud mix)
const FANFARE_VOLUME = 0.3;

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
    this.bgmSequencer.setMuted(this.isBgmMuted);
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
    this.playBrassVoice(ctx, G4, now + 0.0, 0.07, 0.09 * FANFARE_VOLUME, false);
    this.playBrassVoice(ctx, G4, now + 0.08, 0.07, 0.09 * FANFARE_VOLUME, false);
    this.playBrassVoice(ctx, G4, now + 0.16, 0.07, 0.1 * FANFARE_VOLUME, false);

    // 2. Ascending heroic brass phrase
    const C5 = 523.25;
    const E5 = 659.25;
    const G5 = 783.99;
    const E4 = 329.63;

    this.playBrassVoice(ctx, C5, now + 0.26, 0.13, 0.1 * FANFARE_VOLUME, false);
    this.playBrassVoice(ctx, E4, now + 0.26, 0.13, 0.06 * FANFARE_VOLUME, false);

    this.playBrassVoice(ctx, E5, now + 0.4, 0.13, 0.1 * FANFARE_VOLUME, false);
    this.playBrassVoice(ctx, G4, now + 0.4, 0.13, 0.06 * FANFARE_VOLUME, false);

    this.playBrassVoice(ctx, G5, now + 0.54, 0.15, 0.11 * FANFARE_VOLUME, false);
    this.playBrassVoice(ctx, C5, now + 0.54, 0.15, 0.07 * FANFARE_VOLUME, false);

    this.playBrassVoice(ctx, E5, now + 0.7, 0.12, 0.09 * FANFARE_VOLUME, false);
    this.playBrassVoice(ctx, C5, now + 0.7, 0.12, 0.06 * FANFARE_VOLUME, false);

    this.playBrassVoice(ctx, G5, now + 0.83, 0.25, 0.12 * FANFARE_VOLUME, false);
    this.playBrassVoice(ctx, E5, now + 0.83, 0.25, 0.07 * FANFARE_VOLUME, false);

    // 3. Grand Triumphant Full Brass Chord Hold
    const chordTime = now + 1.12;
    const chordDuration = 1.15;

    const kickOsc = ctx.createOscillator();
    const kickGain = ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(120, chordTime);
    kickOsc.frequency.exponentialRampToValueAtTime(40, chordTime + 0.25);
    kickGain.gain.setValueAtTime(0.12 * FANFARE_VOLUME, chordTime);
    kickGain.gain.exponentialRampToValueAtTime(0.001, chordTime + 0.28);
    kickOsc.connect(kickGain);
    kickGain.connect(ctx.destination);
    kickOsc.start(chordTime);
    kickOsc.stop(chordTime + 0.28);

    const C3 = 130.81;
    const C4 = 261.63;
    const C6 = 1046.5;

    this.playBrassVoice(ctx, C3, chordTime, chordDuration, 0.07 * FANFARE_VOLUME, true);
    this.playBrassVoice(ctx, C4, chordTime, chordDuration, 0.06 * FANFARE_VOLUME, true);
    this.playBrassVoice(ctx, E4, chordTime, chordDuration, 0.05 * FANFARE_VOLUME, true);
    this.playBrassVoice(ctx, G4, chordTime, chordDuration, 0.05 * FANFARE_VOLUME, true);
    this.playBrassVoice(ctx, C5, chordTime, chordDuration, 0.08 * FANFARE_VOLUME, true);
    this.playBrassVoice(ctx, E5, chordTime, chordDuration, 0.06 * FANFARE_VOLUME, true);
    this.playBrassVoice(ctx, C6, chordTime, chordDuration, 0.045 * FANFARE_VOLUME, true);
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
