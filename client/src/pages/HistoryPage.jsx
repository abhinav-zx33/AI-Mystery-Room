import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { getCase, getSession } from '../lib/api.js';
import { getStoredCaseIds, getStoredSessionId } from '../lib/session.js';

export default function HistoryPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      setLoading(true);
      setError('');
      try {
        const caseIds = getStoredCaseIds().reverse();
        const savedCases = await Promise.all(caseIds.map(async (caseId) => {
          try {
            const caseFile = await getCase(caseId);
            let status = 'in_progress';
            try {
              const sessionId = getStoredSessionId(caseId);
              if (sessionId) status = (await getSession(sessionId, caseId)).status;
            } catch {
              status = 'session unavailable';
            }
            return { caseId, title: caseFile.title, setting: caseFile.setting, status };
          } catch {
            return { caseId, title: 'Case unavailable', setting: 'This case could not be loaded right now.', status: 'unavailable' };
          }
        }));
        if (active) setEntries(savedCases);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadHistory();
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <AppShell eyebrow="CASE HISTORY">
      <section className="history-intro">
        <p className="eyebrow">YOUR CASE FILES</p>
        <h1>Cases you have opened.</h1>
        <p className="lede">This list is saved in this browser tab. Your cases and game sessions remain on the server.</p>
      </section>

      {loading ? <p className="loading-state" role="status" aria-live="polite">Gathering your case files…</p> : error ? (
        <section className="error-panel" role="alert">
          <p className="eyebrow">HISTORY UNAVAILABLE</p>
          <h2>Could not load your case files.</h2>
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
        </section>
      ) : entries.length === 0 ? (
        <section className="empty-state empty-history">
          <p className="eyebrow">NO CASES HERE YET</p>
          <h2>Your first investigation is waiting.</h2>
          <p>Open the sample case or create a fictional mystery to start your case history.</p>
          <div className="history-actions">
            <Link className="primary-link" to="/create"><span>Create a mystery</span><span aria-hidden="true">↗</span></Link>
            <Link className="secondary-link" to="/cases/demo-case-001">Open sample case</Link>
          </div>
        </section>
      ) : (
        <section className="history-list" aria-label="Saved cases">
          {entries.map((entry) => (
            <article className="history-card" key={entry.caseId}>
              <div>
                <p className="eyebrow">FICTIONAL CASE · {entry.caseId}</p>
                <h2>{entry.title}</h2>
                <p>{entry.setting}</p>
              </div>
              <div className="history-card-actions">
                <span className={`history-status ${entry.status === 'resolved' ? 'is-resolved' : ''}`}>{entry.status === 'resolved' ? 'Resolved' : entry.status === 'in_progress' ? 'In progress' : entry.status === 'unavailable' ? 'Case unavailable' : 'Session expired'}</span>
                <Link className="secondary-link" to={`/cases/${entry.caseId}`}>{entry.status === 'resolved' ? 'Review case' : entry.status === 'unavailable' ? 'Try case again' : 'Continue case'}</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
