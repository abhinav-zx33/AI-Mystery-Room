import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { getCase, getSession, submitAccusation } from '../lib/api.js';
import { getStoredSessionId } from '../lib/session.js';

export default function InvestigationPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [caseFile, setCaseFile] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [selectedSuspect, setSelectedSuspect] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [evidenceType, setEvidenceType] = useState('all');
  const [suspectFilter, setSuspectFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('time');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const id = getStoredSessionId();
        if (!id) { navigate(`/cases/${caseId}`, { replace: true }); return; }
        const [data, session] = await Promise.all([getCase(caseId), getSession(id, caseId)]);
        if (!active) return;
        if (session.status === 'resolved') { navigate(`/cases/${caseId}/result`, { replace: true }); return; }
        setCaseFile(data);
        setSessionId(id);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [caseId, navigate]);

  const filteredEvidence = useMemo(() => {
    const entries = (caseFile?.evidence ?? []).filter((item) => {
      const typeMatch = evidenceType === 'all' || item.type === evidenceType;
      const suspectMatch = suspectFilter === 'all' || item.relatedSuspectIds.includes(suspectFilter);
      return typeMatch && suspectMatch;
    });
    return entries.sort((a, b) => sortOrder === 'title'
      ? a.title.localeCompare(b.title)
      : new Date(a.timestamp ?? 0) - new Date(b.timestamp ?? 0));
  }, [caseFile, evidenceType, suspectFilter, sortOrder]);

  async function makeAccusation() {
    setBusy(true);
    setError('');
    try {
      await submitAccusation(sessionId, selectedSuspect, caseId);
      setConfirming(false);
      navigate(`/cases/${caseId}/result`);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  if (loading) return <AppShell eyebrow="INVESTIGATION"><p className="loading-state" role="status">Laying out the evidence…</p></AppShell>;
  if (error && !caseFile) return <AppShell eyebrow="INVESTIGATION"><section className="error-panel" role="alert"><h1>Investigation unavailable</h1><p>{error}</p><Link to={`/cases/${caseId}`}>Return to the case brief</Link></section></AppShell>;
  if (!caseFile) return null;

  return (
    <AppShell eyebrow="INVESTIGATION ROOM">
      <div className="investigation-top"><div><Link className="back-link" to={`/cases/${caseId}`}>← Case brief</Link><p className="eyebrow">FILE / BW-001 · OPEN INVESTIGATION</p><h1>{caseFile.title}</h1></div><div className="progress-chip">{caseFile.evidence.length} evidence items <span>·</span> 1 final accusation</div></div>
      <div className="investigation-layout">
        <aside className="suspect-rail"><div className="rail-heading"><p className="eyebrow">PEOPLE</p><span>{caseFile.suspects.length}</span></div><p className="rail-help">Compare their accounts with the record.</p>
          {caseFile.suspects.map((person, index) => <button className={`suspect-card ${selectedSuspect === person.id ? 'is-selected' : ''}`} key={person.id} onClick={() => setSelectedSuspect(person.id)} aria-pressed={selectedSuspect === person.id}><span className="suspect-index">0{index + 1}</span><span className="avatar-mark">{person.name.slice(0, 1)}</span><span className="suspect-copy"><strong>{person.name}</strong><small>{person.role}</small></span><span className="selection-dot" aria-hidden="true" /></button>)}
          {selectedSuspect && <div className="suspect-detail"><p className="eyebrow">PROFILE</p><h3>{caseFile.suspects.find((item) => item.id === selectedSuspect)?.name}</h3><p>{caseFile.suspects.find((item) => item.id === selectedSuspect)?.profile}</p><p><strong>Alibi:</strong> {caseFile.suspects.find((item) => item.id === selectedSuspect)?.statedAlibi}</p><p><strong>Apparent motive:</strong> {caseFile.suspects.find((item) => item.id === selectedSuspect)?.apparentMotive}</p></div>}
        </aside>
        <section className="evidence-room"><div className="room-heading"><div><p className="eyebrow">RELEASED MATERIAL</p><h2>Evidence room</h2></div><span className="fiction-tag">FICTIONAL CASE</span></div>
          <div className="filter-bar"><label>Type<select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)}><option value="all">All evidence</option><option value="document">Documents</option><option value="witness_statement">Statements</option><option value="cctv_transcript">Simulated CCTV</option></select></label><label>Related person<select value={suspectFilter} onChange={(event) => setSuspectFilter(event.target.value)}><option value="all">Anyone</option>{caseFile.suspects.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></label><label>Sort<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="time">By time</option><option value="title">By title</option></select></label></div>
          {filteredEvidence.length === 0 ? <div className="empty-state"><p>No evidence matches these filters.</p><button className="text-button" onClick={() => { setEvidenceType('all'); setSuspectFilter('all'); }}>Clear filters</button></div> : <div className="evidence-grid">{filteredEvidence.map((item, index) => <button className={`evidence-tile ${selectedEvidence?.id === item.id ? 'is-open' : ''}`} key={item.id} onClick={() => setSelectedEvidence(selectedEvidence?.id === item.id ? null : item)} aria-expanded={selectedEvidence?.id === item.id}><span className="tile-top"><span>{String(index + 1).padStart(2, '0')} / {item.type.replaceAll('_', ' ')}</span><span aria-hidden="true">↗</span></span><strong>{item.title}</strong><span className="tile-description">{item.description}</span><span className="tile-meta"><span>{new Date(item.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC</span><span className={`reliability reliability-${item.reliability}`}>{item.reliability} reliability</span></span></button>)}</div>}
          {selectedEvidence && <EvidenceDetail item={selectedEvidence} />}
          <section className="timeline-panel"><div className="room-heading"><div><p className="eyebrow">RECONSTRUCTION</p><h2>Timeline</h2></div><span className="small-muted">Chronological · UTC</span></div><ol className="timeline-list">{caseFile.timeline.map((event) => <li key={event.id}><time>{new Date(event.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}</time><div><p>{event.description}</p><span>{event.certainty}</span></div></li>)}</ol></section>
        </section>
      </div>
      <div className="accusation-bar"><div><p className="eyebrow">ONE FINAL ACCUSATION</p><p>{selectedSuspect ? `Selected: ${caseFile.suspects.find((item) => item.id === selectedSuspect)?.name}` : 'Select a suspect to continue.'}</p></div><button className="primary-link button-link" disabled={!selectedSuspect || busy} onClick={() => setConfirming(true)}><span>Make final accusation</span><span aria-hidden="true">→</span></button></div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {confirming && <div className="dialog-backdrop"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-copy"><p className="eyebrow">FINAL DECISION</p><h2 id="confirm-title">Submit your accusation?</h2><p id="confirm-copy">You selected <strong>{caseFile.suspects.find((item) => item.id === selectedSuspect)?.name}</strong>. You get one final accusation and cannot change it afterward.</p><div className="dialog-actions"><button className="secondary-button" disabled={busy} onClick={() => setConfirming(false)}>Go back</button><button className="primary-link button-link" disabled={busy} onClick={makeAccusation}><span>{busy ? 'Recording…' : 'Confirm accusation'}</span><span aria-hidden="true">→</span></button></div></section></div>}
    </AppShell>
  );
}

function EvidenceDetail({ item }) {
  return <article className="evidence-detail"><div className="room-heading"><div><p className="eyebrow">ARTIFACT DETAIL</p><h3>{item.title}</h3></div><span className="fiction-tag">{item.fictionalLabel}</span></div><p>{item.description}</p><ArtifactContent item={item} /><div className="detail-context"><p><strong>Source:</strong> {item.sourceContext}</p><p><strong>Reliability ({item.reliability}):</strong> {item.reliabilityReason}</p></div></article>;
}

function ArtifactContent({ item }) {
  const { content } = item;
  if (item.type === 'document') return <div className="artifact-paper"><span>{content.documentType}</span>{content.text && <p>{content.text}</p>}{content.fields?.map((field) => <p key={field.label}><strong>{field.label}:</strong> {field.value}</p>)}</div>;
  if (item.type === 'witness_statement') return <blockquote className="artifact-quote">“{content.statement}”<footer>— {content.witnessName} · {content.confidence} confidence</footer></blockquote>;
  return <div className="artifact-paper"><p>{item.fictionalLabel}</p>{content.transcript?.map((entry) => <p key={`${entry.timestamp}-${entry.observation}`}><strong>{entry.timestamp}:</strong> {entry.observation}</p>)}{content.limitations?.map((limitation) => <small key={limitation}>Limitation: {limitation}</small>)}</div>;
}
