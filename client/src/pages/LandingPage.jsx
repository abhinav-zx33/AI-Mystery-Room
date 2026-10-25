import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main className="landing page-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="AI Mystery Room home"><span className="brand-mark" aria-hidden="true">✳</span><span>AI MYSTERY ROOM</span></Link>
        <span className="edition">A FICTIONAL INVESTIGATION</span>
      </header>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy"><p className="eyebrow"><span className="status-dot" /> ONE SAMPLE CASE IS READY</p><h1 id="hero-title">Every clue has<br /><em>a story.</em></h1><p className="intro">Follow the evidence through a fictional investigation. Then decide what really happened.</p><Link className="primary-link" to="/create"><span>Play the Sample Case</span><span aria-hidden="true">↗</span></Link><p className="fiction-note"><span aria-hidden="true">ⓘ</span> All cases and evidence are fictional simulations.</p></div>
        <div className="case-art" aria-label="Decorative illustration of a detective evidence board"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="evidence-card evidence-card-back"><span>ARCHIVE / 07</span><i>FILE<br />CLOSED?</i><b>◌</b></div><div className="evidence-card evidence-card-front"><span>CASE NOTE · 23:14</span><i>Someone<br />was here.</i><b>— M.</b></div><span className="pin pin-amber" /><span className="pin pin-red" /><span className="art-caption">EVIDENCE BOARD / UNCLASSIFIED</span></div>
      </section>
      <section className="how-section" aria-labelledby="how-title"><div className="section-heading"><p className="eyebrow">THE METHOD</p><h2 id="how-title">Four steps. One truth.</h2></div><ol className="steps">{[['01', 'Create', 'Open the fixed sample case.'], ['02', 'Investigate', 'Read the statements and examine each clue.'], ['03', 'Accuse', 'Choose the suspect your evidence points to.'], ['04', 'Reveal', 'See how the clues connect.']].map(([number, title, description]) => <li key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></li>)}</ol></section>
      <section className="sample-section" aria-labelledby="sample-title"><div><p className="eyebrow">THE SAMPLE CASE</p><h2 id="sample-title">The Last Light at Bellweather.</h2></div><div className="sample-cards"><article className="sample-card"><span>FICTIONAL CASE · SETTING</span><p>A lighthouse museum on a stormy coast.</p></article><article className="sample-card"><span>FICTIONAL CASE · INCIDENT</span><p>A silver tide bell vanishes while the gallery is dark.</p></article><article className="sample-card"><span>FICTIONAL CASE · CHALLENGE</span><p>Three staff accounts. One final accusation.</p></article></div></section>
      <footer className="footer"><span>AI MYSTERY ROOM</span><span>Every case is fiction. Every conclusion is yours.</span></footer>
    </main>
  );
}
