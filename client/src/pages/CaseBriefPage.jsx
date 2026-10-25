import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { createSession, getCase, getSession } from '../lib/api.js';
import { getStoredSessionId, storeSessionId } from '../lib/session.js';

export default function CaseBriefPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseFile, setCaseFile] = useState(null);
  const [existingSession, setExistingSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const data = await getCase(caseId);
        const storedId = getStoredSessionId();
        let session = null;
        if (storedId) {
          try { session = await getSession(storedId, caseId); }
          catch { /* An in-memory demo session may expire when the server restarts. */ }
        }
        if (active) {
          setCaseFile(data);
          setExistingSession(session);
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [caseId]);

  async function enterCase() {
    setBusy(true);
    setError('');
    try {
      let session = existingSession;
      if (!session) session = await createSession(caseId);
      storeSessionId(session.id);
      navigate(session.status === 'resolved' ? `/cases/${caseId}/result` : `/cases/${caseId}/investigate`);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return (
    <AppShell eyebrow="CASE BRIEF">
      {loading ? <p className="loading-state" role="status">Opening the case file…</p> : error && !caseFile ? <ErrorPanel message={error} /> : caseFile && (
        <>
          <div className="page-kicker"><Link to="/create">← Back to demo desk</Link><span>FILE / BW-001</span></div>
          <section className="case-hero">
            <div><p className="eyebrow">FICTIONAL THEFT · BELLWEATHER COAST</p><h1>{caseFile.title}</h1><p className="lede">{caseFile.summary}</p></div>
            <div className="case-stamp"><span>STATUS</span><strong>{existingSession?.status === 'resolved' ? 'RESOLVED' : 'OPEN'}</strong><small>DEMO CASE · 001</small></div>
          </section>
          <div className="brief-grid">
            <section className="brief-panel"><p className="eyebrow">THE INCIDENT</p><p>The silver tide bell disappeared from a sealed gallery display during a storm blackout. The front glass seal is still intact. Someone may have used the narrow service passage behind the case.</p><dl className="brief-facts"><div><dt>SETTING</dt><dd>{caseFile.setting}</dd></div><div><dt>INCIDENT WINDOW</dt><dd>October 24, 2026 · around 21:00</dd></div><div><dt>ESTIMATED PLAY TIME</dt><dd>{caseFile.playTimeMinutes} minutes</dd></div></dl></section>
            <section className="brief-panel roster-panel"><p className="eyebrow">PEOPLE TO QUESTION</p><div className="roster-count"><strong>{caseFile.suspects.length}</strong><span>suspects</span></div><div className="roster-names">{caseFile.suspects.map((person) => <div key={person.id}><span className="avatar-mark">{person.name.slice(0, 1)}</span><span><strong>{person.name}</strong><small>{person.role}</small></span></div>)}</div></section>
          </div>
          <div className="brief-footer"><p className="fiction-note">Evidence in this case is simulated fiction. No real records or camera footage are involved.</p><div>{error && <p className="inline-error" role="alert">{error}</p>}<button className="primary-link button-link" disabled={busy} onClick={enterCase}><span>{busy ? 'Preparing file…' : existingSession?.status === 'resolved' ? 'Review your result' : existingSession ? 'Continue investigation' : 'Enter investigation'}</span><span aria-hidden="true">↗</span></button></div></div>
        </>
      )}
    </AppShell>
  );
}

function ErrorPanel({ message }) {
  return <section className="error-panel" role="alert"><p className="eyebrow">CASE FILE UNAVAILABLE</p><h1>We couldn’t open this file.</h1><p>{message}</p><Link to="/">Return to the case desk</Link></section>;
}
