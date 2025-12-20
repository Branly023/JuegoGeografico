// Simple Web Audio API synthesizer for game sounds

class AudioService {
    private ctx: AudioContext | null = null;

    constructor() {
        // Initialize interacting with audio context only on user gesture usually, 
        // but we can set it up.
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
            if (Ctx) {
                this.ctx = new Ctx();
            }
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    }

    playSuccess() {
        if (!this.ctx) return;
        // Nice major chord arpeggio
        this.playTone(523.25, 'sine', 0.1, 0);       // C5
        this.playTone(659.25, 'sine', 0.1, 0.1);     // E5
        this.playTone(783.99, 'sine', 0.2, 0.2);     // G5
        this.playTone(1046.50, 'sine', 0.4, 0.3);    // C6
    }

    playWarning() {
        if (!this.ctx) return;
        // Buzz warning
        this.playTone(150, 'sawtooth', 0.2);
    }

    playFailure() {
        if (!this.ctx) return;
        // Sad trombone-ish descending
        this.playTone(300, 'triangle', 0.3, 0);
        this.playTone(280, 'triangle', 0.3, 0.3);
        this.playTone(200, 'sawtooth', 0.6, 0.6);
    }

    playTick() {
        if (!this.ctx) return;
        // Short high-pitched tick
        this.playTone(800, 'sine', 0.05);
    }

    playWin() {
        if (!this.ctx) return;
        // Victory fanfare
        [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50].forEach((freq, i) => {
            this.playTone(freq, 'square', 0.15, i * 0.15);
        });
    }

    playGameOver() {
        if (!this.ctx) return;
        this.playTone(100, 'sawtooth', 1.0);
    }
}

export const audioService = new AudioService();
