import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';

export default function CreateCasePage() {
  return (
    <AppShell eyebrow="DEMO FILE 001">
      <section className="create-intro">
        <p className="eyebrow">A CASE IS READY</p>
        <h1>Start with a<br /><em>real question.</em></h1>
        <p className="lede">Case generation is not part of this milestone. For now, open one fixed sample investigation and follow the evidence to its conclusion.</p>
        <Link className="primary-link" to="/cases/demo-case-001"><span>Open the sample case</span><span aria-hidden="true">↗</span></Link>
        <p className="privacy-note">This demo does not send a premise to an AI provider or collect personal information.</p>
      </section>
      <aside className="file-card"><span>READY FOR REVIEW</span><strong>The Last Light<br />at Bellweather</strong><dl><div><dt>SETTING</dt><dd>Coastal lighthouse museum</dd></div><div><dt>DIFFICULTY</dt><dd>Medium · about 10 minutes</dd></div><div><dt>CONTENTS</dt><dd>3 suspects · 6 evidence items</dd></div></dl></aside>
    </AppShell>
  );
}
