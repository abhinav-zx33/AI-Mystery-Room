import { useEffect, useRef, useState } from 'react';
import { startAmbientMusic } from '../lib/ambient-music.js';

export default function AmbientMusicToggle() {
  const musicRef = useRef(null);
  const startingRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => () => musicRef.current?.stop(), []);

  async function toggleMusic() {
    if (startingRef.current) return;
    setMessage('');
    if (musicRef.current) {
      musicRef.current.stop();
      musicRef.current = null;
      setEnabled(false);
      return;
    }

    startingRef.current = true;
    setStarting(true);
    try {
      musicRef.current = await startAmbientMusic();
      setEnabled(true);
    } catch {
      setEnabled(false);
      setMessage('Ambient music is unavailable in this browser.');
    } finally {
      startingRef.current = false;
      setStarting(false);
    }
  }

  return (
    <div className="ambient-music-control">
      <button
        aria-pressed={enabled}
        aria-label={`Ambient music ${enabled ? 'on' : 'off'}. Toggle background music.`}
        className="ambient-music-button"
        onClick={toggleMusic}
        disabled={starting}
        type="button"
      >
        <span aria-hidden="true">&#9835;</span>
        <span>Music {enabled ? 'On' : 'Off'}</span>
      </button>
      {message && <span className="ambient-music-message" role="status">{message}</span>}
    </div>
  );
}
