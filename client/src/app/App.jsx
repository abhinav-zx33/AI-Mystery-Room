import { Link, Route, Routes } from 'react-router-dom';

function LandingPage() {
  return (
    <main className="landing page-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="AI Mystery Room home">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>AI MYSTERY ROOM</span>
        </Link>
        <span className="edition">A FICTIONAL INVESTIGATION</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> YOUR NEXT CASE BEGINS HERE</p>
          <h1 id="hero-title">Every clue has<br /><em>a story.</em></h1>
          <p className="intro">Bring a premise. Follow the evidence. Decide what really happened.</p>
          <Link className="primary-link" to="/create">
            <span>Create a Mystery</span><span aria-hidden="true">↗</span>
          </Link>
          <p className="fiction-note"><span aria-hidden="true">ⓘ</span> All cases and evidence are fictional simulations.</p>
        </div>
        <div className="case-art" aria-label="Decorative illustration of a detective evidence board">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="evidence-card evidence-card-back"><span>ARCHIVE / 07</span><i>FILE<br />CLOSED?</i><b>◌</b></div>
          <div className="evidence-card evidence-card-front"><span>CASE NOTE · 23:14</span><i>Someone<br />was here.</i><b>— M.</b></div>
          <span className="pin pin-amber" /><span className="pin pin-red" />
          <span className="art-caption">EVIDENCE BOARD / UNCLASSIFIED</span>
        </div>
      </section>

      <section className="how-section" aria-labelledby="how-title">
        <div className="section-heading"><p className="eyebrow">THE METHOD</p><h2 id="how-title">Four steps. One truth.</h2></div>
        <ol className="steps">
          {[
            ['01', 'Create', 'Set the scene with a premise of your own.'],
            ['02', 'Investigate', 'Read the statements and examine each clue.'],
            ['03', 'Accuse', 'Choose the suspect your evidence points to.'],
            ['04', 'Reveal', 'See the solution and how the clues connect.'],
          ].map(([number, title, description]) => (
            <li key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></li>
          ))}
        </ol>
      </section>

      <section className="sample-section" aria-labelledby="sample-title">
        <div><p className="eyebrow">FROM THE CASE FILES</p><h2 id="sample-title">A few places to begin.</h2></div>
        <div className="sample-cards">
          <article className="sample-card"><span>FICTIONAL PROMPT · 01</span><p>A conservator finds a second signature beneath a famous painting.</p></article>
          <article className="sample-card"><span>FICTIONAL PROMPT · 02</span><p>The lighthouse log records a visitor on a night the island was cut off.</p></article>
          <article className="sample-card"><span>FICTIONAL PROMPT · 03</span><p>A midnight train arrives with one extra suitcase and no owner.</p></article>
        </div>
      </section>

      <footer className="footer"><span>AI MYSTERY ROOM</span><span>Every case is fiction. Every conclusion is yours.</span></footer>
    </main>
  );
}

function RoutePlaceholder({ title }) {
  return (
    <main className="placeholder page-shell">
      <Link className="brand" to="/">✳ <span>AI MYSTERY ROOM</span></Link>
      <section><p className="eyebrow">MILESTONE 1 · APPLICATION SHELL</p><h1>{title}</h1>
        <p>This route is in place. Its game feature will be implemented in a later milestone.</p>
        <Link className="text-link" to="/">Return to the case desk <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  );
}

function NotFound() {
  return <RoutePlaceholder title="Page not found" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/create" element={<RoutePlaceholder title="Create a Mystery" />} />
      <Route path="/cases/:caseId" element={<RoutePlaceholder title="Case Brief" />} />
      <Route path="/cases/:caseId/investigate" element={<RoutePlaceholder title="Investigation Room" />} />
      <Route path="/cases/:caseId/result" element={<RoutePlaceholder title="Case Result" />} />
      <Route path="/history" element={<RoutePlaceholder title="Case History" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
