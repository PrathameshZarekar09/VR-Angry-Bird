/**
 * Procedural Cartoon Web Audio Synthesizer
 * 100% self-contained with zero external asset dependencies.
 */

class ProceduralAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.stretchOsc = null;
    this.stretchGain = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Continuous dynamic pitch-bending tension sound for slingshot pullback.
   * @param {number} tensionRatio - 0.0 to 1.0
   */
  updateStretchSound(tensionRatio) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (tensionRatio > 0.05) {
      if (!this.stretchOsc) {
        this.stretchOsc = ctx.createOscillator();
        this.stretchGain = ctx.createGain();
        this.stretchOsc.type = 'sawtooth';

        // Low-pass filter for a rubbery elastic tone
        this.stretchFilter = ctx.createBiquadFilter();
        this.stretchFilter.type = 'lowpass';
        this.stretchFilter.frequency.setValueAtTime(600, ctx.currentTime);

        this.stretchGain.gain.setValueAtTime(0.01, ctx.currentTime);
        this.stretchOsc.connect(this.stretchFilter);
        this.stretchFilter.connect(this.stretchGain);
        this.stretchGain.connect(this.masterGain);
        this.stretchOsc.start();
      }

      const baseFreq = 110 + tensionRatio * 320; // 110Hz -> 430Hz
      const volume = Math.min(0.18, 0.03 + tensionRatio * 0.15);
      const now = ctx.currentTime;

      this.stretchOsc.frequency.setTargetAtTime(baseFreq, now, 0.05);
      this.stretchFilter.frequency.setTargetAtTime(400 + tensionRatio * 1200, now, 0.05);
      this.stretchGain.gain.setTargetAtTime(volume, now, 0.05);
    } else {
      this.stopStretchSound();
    }
  }

  stopStretchSound() {
    if (this.stretchOsc && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.stretchGain.gain.setTargetAtTime(0.0001, now, 0.03);
        setTimeout(() => {
          if (this.stretchOsc) {
            try {
              this.stretchOsc.stop();
              this.stretchOsc.disconnect();
            } catch (_) {}
            this.stretchOsc = null;
            this.stretchGain = null;
            this.stretchFilter = null;
          }
        }, 50);
      } catch (_) {}
    }
  }

  /**
   * Snap/Pop whoosh on slingshot release.
   */
  playLaunch() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.stopStretchSound();

    const now = ctx.currentTime;

    // Resonant snap transient
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(600, now);
    snapOsc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    snapGain.gain.setValueAtTime(0.4, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);
    snapOsc.start(now);
    snapOsc.stop(now + 0.15);

    // Aerodynamic whoosh noise
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(250, now + 0.25);
    filter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.25);
  }

  /**
   * Wooden splinter / stone impact crunch.
   * @param {number} strength - 0.0 to 1.0
   * @param {string} type - 'wood' | 'stone' | 'glass' | 'tnt'
   */
  playImpact(strength = 0.5, type = 'wood') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = Math.min(0.8, Math.max(0.1, strength * 0.6));

    // Thump oscillator
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = type === 'stone' ? 'sine' : 'triangle';

    const startFreq = type === 'stone' ? 140 : type === 'glass' ? 800 : 220;
    const endFreq = type === 'stone' ? 40 : type === 'glass' ? 200 : 60;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.15);

    oscGain.gain.setValueAtTime(vol, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);

    // Crunch noise burst
    const bufSize = Math.floor(ctx.sampleRate * 0.15);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = type === 'glass' ? 'highpass' : 'bandpass';
    noiseFilter.frequency.setValueAtTime(type === 'glass' ? 2500 : 1200, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(vol * 0.7, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.18);
  }

  /**
   * Comical cartoon gasp / squeak when pig is hit or destroyed.
   */
  playPigGasp() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.18);
    osc.frequency.linearRampToValueAtTime(400, now + 0.35);

    // Vibrato
    lfo.frequency.setValueAtTime(25, now);
    lfoGain.gain.setValueAtTime(40, now);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.4);
    osc.stop(now + 0.4);
  }

  /**
   * Powerful TNT explosion boom.
   */
  playExplosion() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sub rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.6);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.65);

    // Blast noise
    const bufLen = Math.floor(ctx.sampleRate * 0.8);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.2));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.8);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.6, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.85);
  }

  /**
   * Special Bird Ability activation sound (Chuck Speed Dash / Bomb Fuse).
   */
  playSpecialAbility(type = 'dash') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'dash') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Bomb fuse sizzle
      this.playExplosion();
    }
  }

  /**
   * Subtle haptic pinch grab chime.
   */
  playPinchHaptic() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.06);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Victory Fanfare chord progression.
   */
  playVictory() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fanfare melody notes (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.12;
      const duration = idx === notes.length - 1 ? 0.8 : 0.16;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }

  /**
   * Comical sad trombone sequence on level defeat.
   */
  playDefeat() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Sad trombone notes with descending slide (D4, C#4, C4, B3)
    const notes = [293.66, 277.18, 261.63, 246.94];
    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.35;
      const isLast = idx === notes.length - 1;
      const duration = isLast ? 0.9 : 0.32;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, startTime);

      osc.frequency.setValueAtTime(freq, startTime);
      if (isLast) {
        osc.frequency.linearRampToValueAtTime(freq - 30, startTime + duration);
      }

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  }
}

export const sound = new ProceduralAudioEngine();
