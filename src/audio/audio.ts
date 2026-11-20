// Web Audio: every sound is synthesised, so the cold start ships no audio files.
// Directional cues are panned and attenuated by distance; the HUD mirrors them
// as subtitles ("steps on the left", "double strike").

export interface Listener {
  x: number;
  z: number;
  yaw: number;
}

export class Audio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private amb!: GainNode;
  private noise!: AudioBuffer;
  private hiss!: GainNode;
  private wind!: GainNode;
  private breath!: GainNode;
  private crackleT = 0;
  private birdT = 2;
  private stepT = 0;
  volume = 0.8;
  effects = 1;
  muted = false;
  listener: Listener = { x: 0, z: 0, yaw: 0 };

  /** Must be called from a user gesture. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.connect(this.master);
    this.amb = ctx.createGain();
    this.amb.connect(this.master);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.hiss = this.loop(2600, 'highpass', 0);
    this.wind = this.loop(320, 'lowpass', 0.05);
    this.breath = this.loop(900, 'bandpass', 0);
    this.applyVolume();
  }

  private loop(freq: number, type: BiquadFilterType, gain: number): GainNode {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(this.amb);
    src.start();
    return g;
  }

  applyVolume(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.sfx.gain.value = this.effects;
  }
  suspend(on: boolean): void {
    if (!this.ctx) return;
    if (on) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  /** Pan (−1 left … 1 right) and gain for a world position. */
  private place(x: number, z: number, range: number): { pan: number; gain: number } {
    const l = this.listener;
    const dx = x - l.x;
    const dz = z - l.z;
    const d = Math.hypot(dx, dz);
    const rx = Math.cos(l.yaw);
    const rz = -Math.sin(l.yaw);
    const pan = d < 0.3 ? 0 : (dx * rx + dz * rz) / d;
    return { pan: Math.max(-1, Math.min(1, pan)), gain: Math.max(0, 1 - d / range) ** 1.5 };
  }

  private out(pan: number, gain: number): AudioNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = gain;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p).connect(this.sfx);
    } else g.connect(this.sfx);
    return g;
  }

  private tone(dest: AudioNode, freq: number, to: number, dur: number, gain: number, type: OscillatorType = 'sine', delay = 0): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private burst(dest: AudioNode, freq: number, q: number, dur: number, gain: number, type: BiquadFilterType = 'bandpass', delay = 0): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loopStart = Math.random();
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 1.5, dur + 0.05);
  }

  /** Inharmonic partials of a small cast bell. */
  private bell(dest: AudioNode, base: number, dur: number, gain: number, delay = 0): void {
    const partials: [number, number, number][] = [
      [1, 1, 1],
      [2.0, 0.55, 0.8],
      [2.76, 0.4, 0.6],
      [5.4, 0.22, 0.35],
      [8.9, 0.1, 0.2],
    ];
    for (const [m, g, d] of partials) this.tone(dest, base * m, base * m * 0.997, dur * d, gain * g, 'sine', delay);
    this.burst(dest, base * 6, 2, 0.03, gain * 0.5, 'bandpass', delay);
  }

  // ------------------------------------------------------------ cues

  chop(): void {
    if (!this.ctx) return;
    const o = this.out(0.15, 0.9);
    this.tone(o, 150, 70, 0.12, 0.5, 'triangle');
    this.burst(o, 1800, 0.8, 0.07, 0.5);
  }
  timber(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.8);
    for (let i = 0; i < 5; i++) this.burst(o, 900 + Math.random() * 1500, 2, 0.05, 0.35, 'bandpass', i * 0.05);
    this.tone(o, 90, 45, 0.3, 0.5, 'triangle', 0.22);
  }
  feed(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.9);
    this.burst(o, 500, 0.6, 0.5, 0.4, 'lowpass');
    for (let i = 0; i < 6; i++) this.burst(o, 2500 + Math.random() * 3000, 4, 0.02, 0.4, 'bandpass', 0.08 + i * 0.06);
  }
  pickup(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.6);
    this.burst(o, 3200, 5, 0.05, 0.4);
    this.tone(o, 1400, 1900, 0.06, 0.12, 'square', 0.03);
  }
  eat(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.5);
    this.burst(o, 700, 1.5, 0.08, 0.4);
    this.burst(o, 600, 1.5, 0.08, 0.3, 'bandpass', 0.14);
  }
  click(on = true): void {
    if (!this.ctx) return;
    this.tone(this.out(0, 0.5), on ? 1900 : 1300, on ? 1700 : 1100, 0.03, 0.2, 'square');
  }
  deny(): void {
    if (!this.ctx) return;
    this.tone(this.out(0, 0.5), 180, 140, 0.09, 0.2, 'square');
  }
  torch(): void {
    if (!this.ctx) return;
    this.burst(this.out(0, 0.8), 900, 0.5, 0.6, 0.4, 'lowpass');
  }
  /** One side chime: the Deer is watching (or a decoy). */
  chime(x: number, z: number): void {
    if (!this.ctx) return;
    const p = this.place(x, z, 38);
    this.bell(this.out(p.pan, 0.25 + p.gain * 0.75), 640, 1.4, 0.3);
  }
  /** Heavy strike: two of these 0.45 s apart mean a real hunt. */
  strike(x: number, z: number): void {
    if (!this.ctx) return;
    const p = this.place(x, z, 44);
    const o = this.out(p.pan, 0.45 + p.gain * 0.55);
    this.bell(o, 262, 1.7, 0.5);
    this.tone(o, 82, 50, 0.3, 0.6, 'triangle');
  }
  /** Thin tin tag: a cache is about to open. */
  tin(x: number, z: number): void {
    if (!this.ctx) return;
    const p = this.place(x, z, 40);
    const o = this.out(p.pan, 0.3 + p.gain * 0.7);
    for (let i = 0; i < 4; i++) {
      this.tone(o, 3100 + Math.random() * 900, 2900, 0.12, 0.16, 'triangle', i * 0.11);
      this.tone(o, 5200 + Math.random() * 800, 5000, 0.07, 0.08, 'sine', i * 0.11);
    }
  }
  deerStep(x: number, z: number, run: boolean): void {
    if (!this.ctx) return;
    const p = this.place(x, z, 26);
    if (p.gain <= 0.01) return;
    const o = this.out(p.pan, p.gain);
    this.tone(o, run ? 95 : 70, 38, 0.16, run ? 0.75 : 0.5, 'triangle');
    this.burst(o, 500, 0.7, 0.06, 0.25, 'lowpass');
  }
  swing(x: number, z: number): void {
    if (!this.ctx) return;
    const p = this.place(x, z, 20);
    this.burst(this.out(p.pan, 0.9), 700, 0.7, 0.45, 0.5, 'bandpass', 0.25);
  }
  hit(): void {
    if (!this.ctx) return;
    const o = this.out(0, 1);
    this.tone(o, 110, 35, 0.35, 0.9, 'triangle');
    for (let i = 0; i < 4; i++) this.burst(o, 1500 + Math.random() * 2500, 3, 0.04, 0.5, 'bandpass', i * 0.03);
  }
  trapSnap(x: number, z: number): void {
    if (!this.ctx) return;
    const p = this.place(x, z, 40);
    const o = this.out(p.pan, 0.4 + p.gain * 0.6);
    this.burst(o, 4200, 3, 0.05, 0.9, 'highpass');
    this.tone(o, 1750, 1500, 0.2, 0.3, 'square');
  }
  trapSet(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.7);
    this.burst(o, 3000, 4, 0.03, 0.5);
    this.tone(o, 900, 700, 0.05, 0.15, 'square', 0.02);
  }
  flare(x: number, z: number): void {
    if (!this.ctx) return;
    const p = this.place(x, z, 50);
    const o = this.out(p.pan, 0.9);
    this.burst(o, 1200, 0.5, 0.15, 0.5, 'highpass');
    this.burst(o, 300, 0.5, 0.9, 0.9, 'lowpass', 0.12);
    this.tone(o, 900, 200, 0.5, 0.25, 'sawtooth', 0.12);
  }
  stunned(): void {
    if (!this.ctx) return;
    const l = this.listener;
    const o = this.out(0, 0.7);
    void l;
    this.bell(o, 180, 0.9, 0.35);
    this.burst(o, 400, 0.6, 0.35, 0.4, 'lowpass');
  }
  dawn(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.7);
    [392, 494, 587, 784].forEach((f, i) => this.tone(o, f, f, 1.6, 0.14, 'sine', i * 0.16));
  }
  bank(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.6);
    this.tone(o, 2100, 2100, 0.3, 0.14, 'triangle');
    this.tone(o, 3150, 3150, 0.4, 0.1, 'triangle', 0.09);
  }
  /** Tutorial step ticked off: two soft low notes, quieter than any gameplay cue. */
  tutorialTick(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.5);
    this.tone(o, 523, 523, 0.18, 0.09, 'sine');
    this.tone(o, 784, 784, 0.26, 0.07, 'sine', 0.08);
  }
  death(): void {
    if (!this.ctx) return;
    const o = this.out(0, 1);
    this.tone(o, 140, 30, 1.2, 0.7, 'sawtooth');
    this.bell(o, 131, 3, 0.4, 0.3);
  }
  cardPick(): void {
    if (!this.ctx) return;
    const o = this.out(0, 0.6);
    this.tone(o, 660, 660, 0.25, 0.16, 'triangle');
    this.tone(o, 990, 990, 0.35, 0.12, 'triangle', 0.08);
  }
  playerStep(run: boolean): void {
    if (!this.ctx) return;
    this.burst(this.out((Math.random() - 0.5) * 0.3, run ? 0.32 : 0.2), 260 + Math.random() * 120, 0.8, 0.07, 0.8, 'lowpass');
  }

  /** Continuous layers: crackle rate, weak-fire hiss, wind, birds, breath. */
  ambient(dt: number, o: { fuel: number; bright: boolean; fireDist: number; night: number; birds: boolean; stamina: number; speed: number; sprint: boolean; active: boolean }): void {
    if (!this.ctx || !o.active) return;
    const near = Math.max(0, 1 - o.fireDist / 16);
    const t = this.ctx.currentTime;
    this.hiss.gain.setTargetAtTime(o.fuel > 0 && !o.bright ? 0.05 * near : 0.006 * near * (o.fuel > 0 ? 1 : 0), t, 0.3);
    this.wind.gain.setTargetAtTime(0.035 + 0.05 * o.night, t, 1);
    this.breath.gain.setTargetAtTime(o.stamina < 35 ? 0.05 * (0.5 + 0.5 * Math.sin(t * 5.5)) * (1 - o.stamina / 35) : 0, t, 0.08);
    // Separate log pops inside the safe circle.
    this.crackleT -= dt;
    if (this.crackleT <= 0 && o.fuel > 0) {
      this.crackleT = (o.bright ? 0.12 : 0.5) + Math.random() * (o.bright ? 0.45 : 0.9);
      if (near > 0.02) this.burst(this.out((Math.random() - 0.5) * 0.4, near * (o.bright ? 0.5 : 0.25)), 1800 + Math.random() * 4000, 6, 0.018, 0.9);
    }
    this.birdT -= dt;
    if (this.birdT <= 0) {
      this.birdT = 1.5 + Math.random() * 4;
      if (o.birds) {
        const out = this.out(Math.random() * 2 - 1, 0.12);
        const f = 2400 + Math.random() * 1800;
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) this.tone(out, f, f * (0.8 + Math.random() * 0.5), 0.07, 0.3, 'sine', i * 0.1);
      }
    }
    if (o.speed > 0.5) {
      this.stepT -= dt * (o.sprint ? 1.5 : 1);
      if (this.stepT <= 0) {
        this.stepT = 0.46;
        this.playerStep(o.sprint);
      }
    } else this.stepT = 0.1;
  }
}
