// ============================================================
// CALM / Medicine to Meditation Hybrid Audio Engine
// Supports both high-fidelity MP3 audio files and procedural
// Web Audio API Solfeggio & nature synthesis with strict single-instance playback.
// ============================================================

type ProgressCallback = (currentTime: number, duration: number) => void;
type StateCallback = (isPlaying: boolean) => void;

class CalmAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTrackId: string | null = null;
  private currentFileUrl: string | null = null;
  private volume: number = 0.5;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  
  // HTML5 Audio Element for MP3 tracks
  private audioEl: HTMLAudioElement | null = null;
  private progressListeners: Set<ProgressCallback> = new Set();
  private stateListeners: Set<StateCallback> = new Set();
  private lastKnownCurrentTime: number = 0;
  private lastKnownDuration: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (this.audioEl || typeof window === 'undefined') return;

    this.audioEl = new Audio();
    this.audioEl.preload = 'metadata';
    this.audioEl.loop = true; // Seamless meditative continuous playback

    this.audioEl.addEventListener('timeupdate', () => {
      if (this.audioEl) {
        this.lastKnownCurrentTime = this.audioEl.currentTime;
        this.lastKnownDuration = this.audioEl.duration || this.lastKnownDuration;
        this.notifyProgress(this.lastKnownCurrentTime, this.lastKnownDuration);
      }
    });

    this.audioEl.addEventListener('loadedmetadata', () => {
      if (this.audioEl) {
        this.lastKnownDuration = this.audioEl.duration || 0;
        this.notifyProgress(this.audioEl.currentTime, this.lastKnownDuration);
      }
    });

    this.audioEl.addEventListener('play', () => {
      this.isPlaying = true;
      this.notifyState(true);
    });

    this.audioEl.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifyState(false);
    });

    this.audioEl.addEventListener('error', (e) => {
      console.warn('Audio element error or network interruption:', e);
      this.isPlaying = false;
      this.notifyState(false);
    });
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public onProgress(cb: ProgressCallback): () => void {
    this.progressListeners.add(cb);
    cb(this.lastKnownCurrentTime, this.lastKnownDuration);
    return () => this.progressListeners.delete(cb);
  }

  public onStateChange(cb: StateCallback): () => void {
    this.stateListeners.add(cb);
    cb(this.isPlaying);
    return () => this.stateListeners.delete(cb);
  }

  private notifyProgress(cur: number, dur: number) {
    this.progressListeners.forEach(cb => {
      try { cb(cur, dur); } catch (e) {}
    });
  }

  private notifyState(playing: boolean) {
    this.stateListeners.forEach(cb => {
      try { cb(playing); } catch (e) {}
    });
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrack(): string | null {
    return this.currentTrackId;
  }

  public getCurrentTime(): number {
    if (this.audioEl && this.currentFileUrl) {
      return this.audioEl.currentTime;
    }
    return this.lastKnownCurrentTime;
  }

  public getDuration(): number {
    if (this.audioEl && this.currentFileUrl && this.audioEl.duration && !isNaN(this.audioEl.duration)) {
      return this.audioEl.duration;
    }
    return this.lastKnownDuration;
  }

  public seek(seconds: number) {
    if (this.audioEl && this.currentFileUrl) {
      const dur = this.audioEl.duration || this.lastKnownDuration;
      const target = Math.max(0, Math.min(seconds, dur > 0 ? dur : seconds));
      this.audioEl.currentTime = target;
      this.lastKnownCurrentTime = target;
      this.notifyProgress(target, dur);
    }
  }

  /**
   * Pause without resetting position
   */
  public pause() {
    if (this.audioEl && this.currentFileUrl) {
      this.audioEl.pause();
    }
    this.stopGenerativeNodes();
    this.isPlaying = false;
    this.notifyState(false);
  }

  /**
   * Resume paused track
   */
  public resume() {
    if (this.currentFileUrl && this.audioEl) {
      this.audioEl.play().catch(err => {
        console.warn('Playback resume prevented:', err);
      });
      this.isPlaying = true;
      this.notifyState(true);
    } else if (this.currentTrackId) {
      this.playTrack(this.currentTrackId, null);
    }
  }

  /**
   * Stop completely and reset
   */
  public stop() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
    }
    this.stopGenerativeNodes();
    this.isPlaying = false;
    this.currentTrackId = null;
    this.currentFileUrl = null;
    this.lastKnownCurrentTime = 0;
    this.notifyState(false);
    this.notifyProgress(0, this.lastKnownDuration);
  }

  private stopGenerativeNodes() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
    setTimeout(() => {
      this.activeNodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch (e) {}
      });
      this.activeNodes = [];
    }, 150);
  }

  /**
   * Main Play Track entrypoint.
   * Handles both MP3 files via HTML5 Audio and fallback generative synthesizers.
   * Guarantees only one sound source plays at any moment.
   */
  public playTrack(trackId: string, fileUrl?: string | null, knownDurationSec?: number) {
    this.initAudioElement();

    // If resuming the exact same MP3 track that was paused
    if (this.currentTrackId === trackId && !this.isPlaying && this.currentFileUrl && this.audioEl) {
      this.audioEl.play().catch(err => console.warn('Play error:', err));
      this.isPlaying = true;
      this.notifyState(true);
      return;
    }

    // Stop previous instance before starting new one (Guarantees zero duplicate instances)
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.stopGenerativeNodes();

    this.currentTrackId = trackId;
    this.currentFileUrl = fileUrl || null;
    if (knownDurationSec) {
      this.lastKnownDuration = knownDurationSec;
    }

    // 1. Play MP3 File Audio Asset
    if (fileUrl && this.audioEl) {
      this.audioEl.src = fileUrl;
      this.audioEl.volume = this.volume;
      this.audioEl.currentTime = 0;
      this.lastKnownCurrentTime = 0;

      const playPromise = this.audioEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.notifyState(true);
          })
          .catch((err) => {
            console.warn('Browser autoplay prevented or audio load failed:', err);
            this.isPlaying = false;
            this.notifyState(false);
          });
      }
      return;
    }

    // 2. Play Procedural Generative Web Audio Synthesizer
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.3);
      this.isPlaying = true;
      this.notifyState(true);

      switch (trackId) {
        case 'track-396hz':
          this.playSolfeggioTone(396, 4);
          break;
        case 'track-432hz':
          this.playSolfeggioTone(432, 6);
          break;
        case 'track-morning-mist':
          this.playMountainMist();
          break;
        case 'track-still-waters':
          this.playWaterAmbiance();
          break;
        case 'track-forest-canopy':
          this.playForestCanopy();
          break;
        case 'track-evening-drift':
        default:
          this.playEveningDrift();
          break;
      }
    }, 200);
  }

  // --- Web Audio API Procedural Generators ---
  private playSolfeggioTone(freq: number, beatOffset: number) {
    if (!this.ctx || !this.masterGain) return;

    const leftOsc = this.ctx.createOscillator();
    const rightOsc = this.ctx.createOscillator();
    const leftGain = this.ctx.createGain();
    const rightGain = this.ctx.createGain();
    const merger = this.ctx.createChannelMerger(2);

    leftOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    leftGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);

    rightOsc.type = 'sine';
    rightOsc.frequency.setValueAtTime(freq + beatOffset, this.ctx.currentTime);
    rightGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);

    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq / 2, this.ctx.currentTime);
    subGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    merger.connect(this.masterGain);

    leftOsc.start();
    rightOsc.start();
    subOsc.start();

    this.activeNodes.push(leftOsc, rightOsc, subOsc, leftGain, rightGain, subGain, merger);
  }

  private playMountainMist() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();

    this.activeNodes.push(whiteNoise, lfo, filter, lfoGain, noiseGain);
  }

  private playWaterAmbiance() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(500, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(200, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    lfo.start();

    this.activeNodes.push(noise, lfo, bandpass, lfoGain, gain);
  }

  private playForestCanopy() {
    this.playMountainMist();
    if (!this.ctx || !this.masterGain) return;
    const rootOsc = this.ctx.createOscillator();
    const rootGain = this.ctx.createGain();
    rootOsc.type = 'sine';
    rootOsc.frequency.setValueAtTime(174, this.ctx.currentTime);
    rootGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    rootOsc.connect(rootGain);
    rootGain.connect(this.masterGain);
    rootOsc.start();
    this.activeNodes.push(rootOsc, rootGain);
  }

  private playEveningDrift() {
    if (!this.ctx || !this.masterGain) return;

    const chordFrequencies = [87.31, 130.81, 164.81, 220.0, 261.63];

    chordFrequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08 / chordFrequencies.length, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      this.activeNodes.push(osc, filter, gain);
    });
  }
}

export const calmAudio = typeof window !== 'undefined' ? new CalmAudioEngine() : null;
