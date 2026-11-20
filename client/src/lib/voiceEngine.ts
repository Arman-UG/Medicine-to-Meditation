// ============================================================
// CALM Voice Guidance Engine (Web Speech API)
// Provides gentle, spoken spoken relaxation prompts.
// ============================================================

class CalmVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.8;
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prefer soothing English voices (e.g. natural, Google, Samantha, Daniel, or British/Indian English)
    const calmVoice = voices.find(v => 
      v.lang.startsWith('en') && (
        v.name.includes('Natural') || 
        v.name.includes('Female') || 
        v.name.includes('Samantha') || 
        v.name.includes('Google UK') ||
        v.name.includes('Karen') ||
        v.name.includes('Zira')
      )
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0] || null;

    this.preferredVoice = calmVoice;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled && this.synth) {
      this.synth.cancel();
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public speak(text: string) {
    if (!this.isEnabled || !this.synth) return;

    // Cancel any ongoing phrase so they don't overlap awkwardly
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    // Gentle pace and natural calm tone
    utterance.rate = 0.86; 
    utterance.pitch = 0.96;
    utterance.volume = this.volume;

    this.synth.speak(utterance);
  }

  public cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const calmVoice = typeof window !== 'undefined' ? new CalmVoiceEngine() : null;
