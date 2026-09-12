// Web Audio API Synthesizer Engine for POWER CUT
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initOnInteraction();
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initOnInteraction() {
    const unlock = () => {
      this.init();
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Helper tone builder
  playTone(freq, type, duration, startGain = 0.3, endGain = 0.001) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(startGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(endGain, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // 1. Button Click
  playButtonClick() {
    this.playTone(600, 'sine', 0.08, 0.2);
  }

  // 2. Electrical Spark
  playSpark() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2000;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {}
  }

  // 3. Power Cut Outage Sequence
  playPowerCut() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Sawtooth buzz pitch down
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);

      // Thud
      setTimeout(() => this.playTone(60, 'triangle', 0.4, 0.5), 200);
    } catch (e) {}
  }

  // 4. Clock Tick
  playClockTick() {
    this.playTone(900, 'triangle', 0.03, 0.15);
  }

  // 5. Cat Meow (Pitch Swept Sine)
  playMeow() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.linearRampToValueAtTime(750, t + 0.2);
      osc.frequency.linearRampToValueAtTime(400, t + 0.45);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    } catch (e) {}
  }

  // 6. Phone Ringing
  playPhoneRing() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const playPulse = (delay) => {
        setTimeout(() => {
          this.playTone(853, 'sine', 0.12, 0.2);
          this.playTone(960, 'sine', 0.12, 0.2);
        }, delay);
      };
      playPulse(0);
      playPulse(150);
      playPulse(300);
    } catch (e) {}
  }

  // 7. Flashlight Click
  playFlashlight() {
    this.playTone(1200, 'square', 0.05, 0.15);
  }

  // 8. Wrong Click Boing
  playWrongClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.25);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch (e) {}
  }

  // 9. Time's Up Alarm Buzzer
  playBuzzer() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.5);
    } catch (e) {}
  }

  // 10. Uselessness Triumph Fanfare (Slightly comical chord)
  playRevealFanfare() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.6, 0.25);
      }, idx * 100);
    });
  }
}

const sounds = new SoundEngine();
