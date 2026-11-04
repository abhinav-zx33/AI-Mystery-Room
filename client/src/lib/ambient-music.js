// A small, original detective-score loop synthesized locally with Web Audio.
// It uses a minor-key string drone, a quiet pocket-watch pulse, and a sparse motif.
const chords = [
  [73.42, 110, 146.83], // D minor
  [65.41, 98, 130.81], // C
  [58.27, 87.31, 116.54], // Bb
  [69.3, 103.83, 138.59], // C# diminished color
];

const motif = [
  587.33, null, 698.46, 830.61, null, 698.46, 622.25, null,
  523.25, null, 622.25, 783.99, null, 698.46, 587.33, null,
];
const beatLength = 560;

export async function startAmbientMusic() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error('Audio is not supported in this browser.');

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.setValueAtTime(0.58, context.currentTime);
  master.connect(context.destination);

  try {
    await context.resume();

    const pad = context.createGain();
    const lowPass = context.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(520, context.currentTime);
    pad.gain.setValueAtTime(0.055, context.currentTime);
    lowPass.connect(pad);
    pad.connect(master);

    const padVoices = chords[0].map((frequency, index) => {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      oscillator.type = index === 0 ? 'triangle' : 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      voice.gain.setValueAtTime(index === 0 ? 0.42 : 0.2, context.currentTime);
      oscillator.connect(voice);
      voice.connect(lowPass);
      oscillator.start();
      return oscillator;
    });

    const bass = context.createOscillator();
    const bassGain = context.createGain();
    bass.type = 'sine';
    bass.frequency.setValueAtTime(36.71, context.currentTime);
    bassGain.gain.setValueAtTime(0.12, context.currentTime);
    bass.connect(bassGain);
    bassGain.connect(master);
    bass.start();

    let beat = 0;
    let stopped = false;
    const transients = new Set();

    const playTone = (frequency, startAt, duration, volume, type = 'sine') => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      envelope.gain.setValueAtTime(0.0001, startAt);
      envelope.gain.exponentialRampToValueAtTime(volume, startAt + 0.035);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(envelope);
      envelope.connect(master);
      transients.add(oscillator);
      oscillator.addEventListener('ended', () => transients.delete(oscillator), { once: true });
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.02);
    };

    const advance = () => {
      if (stopped) return;
      const now = context.currentTime;
      if (beat % 16 === 0) {
        const chord = chords[(beat / 16) % chords.length];
        padVoices.forEach((oscillator, index) => {
          oscillator.frequency.setTargetAtTime(chord[index], now, 1.8);
        });
        bass.frequency.setTargetAtTime(chord[0] / 2, now, 1.2);
      }

      const note = motif[beat % motif.length];
      if (note) playTone(note, now + 0.015, 0.42, 0.045, 'triangle');

      // A restrained ticking pulse gives it a clue-room / pocket-watch feel.
      if (beat % 2 === 0) playTone(1180, now, 0.045, 0.018);
      // A quiet low thud marks the start of each four-beat bar.
      if (beat % 4 === 0) playTone(73.42, now, 0.22, 0.035);
      beat += 1;
    };

    advance();
    const intervalId = window.setInterval(advance, beatLength);

    return {
      stop() {
        if (stopped) return;
        stopped = true;
        window.clearInterval(intervalId);
        const stopAt = context.currentTime + 0.4;
        master.gain.setTargetAtTime(0.0001, context.currentTime, 0.09);
        [...padVoices, bass, ...transients].forEach((source) => {
          try { source.stop(stopAt); } catch { /* It may already have stopped. */ }
        });
        window.setTimeout(() => context.close().catch(() => {}), 550);
      },
    };
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }
}
