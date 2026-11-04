import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';
import { createCase } from '../lib/api.js';
import { storeSessionId } from '../lib/session.js';

const evidenceOptions = [
  ['chat', 'Simulated chat'],
  ['image', 'Evidence card'],
  ['cctv_transcript', 'CCTV transcript'],
  ['document', 'Document'],
  ['witness_statement', 'Witness statement'],
  ['timeline', 'Timeline artifact'],
];
const defaultEvidenceTypes = evidenceOptions.map(([type]) => type);

export default function CreateCasePage() {
  const navigate = useNavigate();
  const [premise, setPremise] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [tone, setTone] = useState('classic_detective');
  const [setting, setSetting] = useState('');
  const [evidenceTypes, setEvidenceTypes] = useState(defaultEvidenceTypes);
  const [playTimeMinutes, setPlayTimeMinutes] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function toggleEvidenceType(type) {
    setEvidenceTypes((current) => current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type]);
  }

  async function submitPremise(event) {
    event.preventDefault();
    const normalizedPremise = premise.trim();
    if (normalizedPremise.length < 30 || normalizedPremise.length > 1500) {
      setError('Your premise must be between 30 and 1,500 characters after trimming.');
      return;
    }
    if (evidenceTypes.length === 0) {
      setError('Choose at least one evidence type.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const { case: caseFile, session } = await createCase({
        premise: normalizedPremise,
        difficulty,
        tone,
        setting: setting.trim(),
        evidenceTypes,
        playTimeMinutes: Number(playTimeMinutes),
      });
      storeSessionId(session.id, caseFile.id);
      navigate(`/cases/${caseFile.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return (
    <AppShell eyebrow="CREATE A CASE">
      <section className="create-intro">
        <p className="eyebrow">A FICTIONAL CASE BEGINS WITH A PREMISE</p>
        <h1>Set the scene.<br /><em>Follow the clues.</em></h1>
        <p className="lede">Describe a fictional incident. The case desk will prepare suspects, evidence, and a hidden solution for your investigation.</p>
      </section>

      <form className="create-form" onSubmit={submitPremise} aria-busy={busy}>
        <label className="form-field premise-field">
          <span>What happened? <small>30–1,500 characters</small></span>
          <textarea
            value={premise}
            onChange={(event) => setPremise(event.target.value)}
            minLength={30}
            maxLength={1500}
            rows={6}
            required
            aria-invalid={premise.trim().length < 30 || premise.trim().length > 1500 ? 'true' : undefined}
            placeholder="A rare manuscript disappears from a locked museum archive during a brief power cut..."
            aria-describedby="premise-help premise-count"
          />
          <small id="premise-help">Keep the people and events fictional. Don’t include private details about real people.</small>
          <small id="premise-count" className="character-count">{premise.length} / 1,500</small>
        </label>

        <div className="form-settings-grid">
          <label className="form-field">
            <span>Difficulty</span>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </label>
          <label className="form-field">
            <span>Tone</span>
            <select value={tone} onChange={(event) => setTone(event.target.value)}>
              <option value="classic_detective">Classic detective</option><option value="suspense">Suspense</option><option value="lighthearted">Lighthearted</option><option value="noir">Noir</option>
            </select>
          </label>
          <label className="form-field">
            <span>Setting <small>Optional, up to 120 characters</small></span>
            <input value={setting} onChange={(event) => setSetting(event.target.value)} maxLength={120} placeholder="A small museum during a private exhibition" />
          </label>
          <label className="form-field">
            <span>Estimated play time</span>
            <select value={playTimeMinutes} onChange={(event) => setPlayTimeMinutes(event.target.value)}>
              <option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={20}>20 minutes</option>
            </select>
          </label>
        </div>

        <fieldset className="evidence-options">
          <legend>Evidence to include</legend>
          <p>Choose one or more types. All chats and records are fictional simulations.</p>
          <div className="evidence-option-grid">
            {evidenceOptions.map(([type, label]) => (
              <label key={type}>
                <input type="checkbox" checked={evidenceTypes.includes(type)} onChange={() => toggleEvidenceType(type)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="privacy-note">Your premise is sent to Google Gemini to create the case. Don’t enter real names, private messages, or other sensitive personal information.</p>
        {error && <p className="inline-error form-error" role="alert">{error}</p>}
        <div className="form-submit-row">
          <button className="primary-link button-link" type="submit" disabled={busy}>
            <span>{busy ? 'Building and checking the case…' : 'Generate fictional case'}</span><span aria-hidden="true">↗</span>
          </button>
          {busy && <p className="generation-status" role="status" aria-live="polite"><span className="loading-indicator" aria-hidden="true" />Preparing and checking your fictional investigation. This may take a little while.</p>}
        </div>
      </form>
      <p className="privacy-note">Want to try the fixed demo? <Link to="/cases/demo-case-001">Open the sample case</Link>.</p>
    </AppShell>
  );
}
