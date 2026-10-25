import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { getResult } from '../lib/api.js';
import { clearStoredSessionId, getStoredSessionId } from '../lib/session.js';

export default function ResultPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      const sessionId = getStoredSessionId();
      if (!sessionId) {
        if (active) { setError('Submit a final accusation before opening the solution.'); setLoading(false); }
        return;
      }
      try {
        const data = await getResult(sessionId, caseId);
        if (active) setResult(data);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [caseId]);

  function replay() {
    clearStoredSessionId();
    navigate(`/cases/${caseId}`);
  }

  if (loading) return <AppShell eyebrow="CASE REVEAL"><p className="loading-state" role="status">Unsealing the result…</p></AppShell>;
  if (error || !result) return <AppShell eyebrow="CASE REVEAL"><section className="error-panel" role="status"><p className="eyebrow">SOLUTION SEALED</p><h1>Not ready to reveal.</h1><p>{error}</p><Link className="primary-link" to={`/cases/${caseId}/investigate`}><span>Return to investigation</span><span aria-hidden="true">↗</span></Link></section></AppShell>;

  return (
    <AppShell eyebrow="CASE REVEAL">
      <div className={`result-banner ${result.isCorrect ? 'result-correct' : 'result-incorrect'}`}><p className="eyebrow">YOUR ACCUSATION · {result.score} / 100 POINTS</p><h1>{result.isCorrect ? 'You followed the evidence.' : 'The clues led somewhere else.'}</h1><p>{result.isCorrect ? 'Your accusation was correct.' : 'Your accusation was recorded. Here is what the case file shows.'}</p></div>
      <section className="culprit-card"><div><p className="eyebrow">THE CASE RESOLUTION</p><h2>{result.culprit.name}</h2><p className="culprit-role">Lighthouse keeper · Bellweather</p></div><div className="answer-seal" aria-label="Case resolved">CASE<br />CLOSED</div></section>
      <section className="reveal-section"><p className="eyebrow">HOW IT HAPPENED</p><h2>The route behind the display</h2><p className="reveal-copy">{result.explanation}</p><div className="method-grid"><article><span>MOTIVE</span><p>{result.motive}</p></article><article><span>METHOD</span><p>{result.method}</p></article></div></section>
      <section className="reveal-section"><div className="room-heading"><div><p className="eyebrow">THE EVIDENCE CHAIN</p><h2>Clues that connect</h2></div><span className="small-muted">Supporting, not certainty alone</span></div><ol className="chain-list">{result.evidenceChain.map((item, index) => <li key={item.evidenceId}><span className="chain-number">0{index + 1}</span><div><h3>{item.title}</h3><p>{item.deduction}</p><small>{item.strength}</small></div></li>)}</ol></section>
      <section className="reveal-section"><div className="room-heading"><div><p className="eyebrow">WHAT ABOUT THE OTHERS?</p><h2>Other suspects</h2></div></div><div className="clearance-grid">{result.suspectClearance.map((item) => <article key={item.suspectId}><h3>{item.name}</h3><p>{item.explanation}</p></article>)}</div></section>
      <section className="reveal-section"><div className="room-heading"><div><p className="eyebrow">RECONSTRUCTED SEQUENCE</p><h2>The night in order</h2></div></div><ol className="timeline-list result-timeline">{result.timelineReconstruction.map((event) => <li key={event.timestamp}><time>{event.timestamp}</time><div><p>{event.description}</p></div></li>)}</ol></section>
      <div className="result-actions"><p className="fiction-note">This is a fixed, fictional demo solution. The server revealed it only after your accusation.</p><button className="primary-link button-link" onClick={replay}><span>Play the case again</span><span aria-hidden="true">↗</span></button></div>
    </AppShell>
  );
}
