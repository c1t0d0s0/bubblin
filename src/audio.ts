class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check saved mute state
    const saved = localStorage.getItem('bubblin_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('bubblin_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playShoot(): void {
    if (this.isMuted) return;
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

  private lastBounceTime: number = 0;

  public playBounce(): void {
    if (this.isMuted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastBounceTime < 60) return; // Debounce rapid bounce triggers
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
    if (this.isMuted) return;
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
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Scale pitch based on combo (pentatonic scale)
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const baseIndex = Math.min(combo - 1, scale.length - 1);
    const freq = scale[Math.max(0, baseIndex)];

    const now = ctx.currentTime;

    // Pop bubble effect: 2 oscillators for rich glassy chime
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
    if (this.isMuted) return;
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

  private lastSplashTime: number = 0;
  public playBubbleSplash(): void {
    if (this.isMuted) return;
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
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // For drops of 3+ bubbles, trigger deep thud punch
    if (count >= 3) {
      this.playHeavyThud();
    }

    // High energy rising and cascading fanfare
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
    if (this.isMuted) return;
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

  /**
   * Synthesizes a realistic, bright brass/trumpet tone using dual detuned sawtooth
   * oscillators, resonant biquad lowpass filter with dynamic attack envelope, and vibrato.
   */
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

    // Dual sawtooth with subtle detuning (+5 cents) for realistic brass section chorus
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, startTime);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.003, startTime);

    // Warm body sub oscillator
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq, startTime);

    // Resonant brass filter (BiquadFilter lowpass with dynamic attack "bite")
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(2.6, startTime);

    // Filter envelope: opens bright on tongue attack, settles to warm sustain
    const peakCutoff = Math.min(6500, freq * 4.2);
    const sustainCutoff = Math.min(4200, freq * 2.6);
    filter.frequency.setValueAtTime(850, startTime);
    filter.frequency.exponentialRampToValueAtTime(peakCutoff, startTime + 0.035);
    filter.frequency.exponentialRampToValueAtTime(sustainCutoff, startTime + 0.12);

    // Vibrato for held fanfare notes
    if (hasVibrato && duration > 0.3) {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(5.4, startTime); // 5.4 Hz vibrato
      lfoGain.gain.setValueAtTime(0, startTime);
      lfoGain.gain.setValueAtTime(0, startTime + 0.18);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.012, startTime + 0.45);

      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);

      lfo.start(startTime);
      lfo.stop(startTime + duration);
    }

    // Brass amp envelope: sharp brass bite attack, sustained body, clean release
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.022);
    gain.gain.setValueAtTime(volume * 0.88, startTime + 0.07);
    gain.gain.setValueAtTime(volume * 0.85, startTime + Math.max(0.08, duration - 0.05));
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Routing
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
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;

    // ==============================================
    // TRIUMPHANT TRUMPET BRASS FANFARE (C Major)
    // Adjusted to a comfortable, well-balanced volume
    // ==============================================

    // 1. Triple-tongue trumpet pickup ("Ta-ta-ta!")
    const G4 = 392.00;
    this.playBrassVoice(ctx, G4, now + 0.00, 0.07, 0.09, false);
    this.playBrassVoice(ctx, G4, now + 0.08, 0.07, 0.09, false);
    this.playBrassVoice(ctx, G4, now + 0.16, 0.07, 0.10, false);

    // 2. Ascending heroic brass phrase with two-part harmony ("Ta-da-da-da-DAAA!")
    const C5 = 523.25;
    const E5 = 659.25;
    const G5 = 783.99;
    const E4 = 329.63;

    // Note 1: C5 + E4 harmony
    this.playBrassVoice(ctx, C5, now + 0.26, 0.13, 0.10, false);
    this.playBrassVoice(ctx, E4, now + 0.26, 0.13, 0.06, false);

    // Note 2: E5 + G4 harmony
    this.playBrassVoice(ctx, E5, now + 0.40, 0.13, 0.10, false);
    this.playBrassVoice(ctx, G4, now + 0.40, 0.13, 0.06, false);

    // Note 3: G5 + C5 harmony
    this.playBrassVoice(ctx, G5, now + 0.54, 0.15, 0.11, false);
    this.playBrassVoice(ctx, C5, now + 0.54, 0.15, 0.07, false);

    // Note 4: E5 + C5 cadence bounce
    this.playBrassVoice(ctx, E5, now + 0.70, 0.12, 0.09, false);
    this.playBrassVoice(ctx, C5, now + 0.70, 0.12, 0.06, false);

    // Note 5: G5 peak
    this.playBrassVoice(ctx, G5, now + 0.83, 0.25, 0.12, false);
    this.playBrassVoice(ctx, E5, now + 0.83, 0.25, 0.07, false);

    // 3. Grand Triumphant Full Brass Chord Hold (+1.12s to +2.2s)
    const chordTime = now + 1.12;
    const chordDuration = 1.15;

    // Soft warm timpani bass punch under the chord
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

    // 6-Voice Brass Ensemble Chord (balanced mix totaling ~0.42 peak)
    const C3 = 130.81; // Bass Trombone
    const C4 = 261.63; // Tenor Trombone
    const C6 = 1046.50; // High Trumpet Solo Double

    this.playBrassVoice(ctx, C3, chordTime, chordDuration, 0.07, true);
    this.playBrassVoice(ctx, C4, chordTime, chordDuration, 0.06, true);
    this.playBrassVoice(ctx, E4, chordTime, chordDuration, 0.05, true);
    this.playBrassVoice(ctx, G4, chordTime, chordDuration, 0.05, true);
    this.playBrassVoice(ctx, C5, chordTime, chordDuration, 0.08, true);
    this.playBrassVoice(ctx, E5, chordTime, chordDuration, 0.06, true);
    this.playBrassVoice(ctx, C6, chordTime, chordDuration, 0.045, true);
  }

  public playGameOver(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    // Sad descending tones
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
