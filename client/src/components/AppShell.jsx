import { Link } from 'react-router-dom';

export default function AppShell({ children, eyebrow = 'THE CASE DESK' }) {
  return (
    <div className="app-frame page-shell">
      <header className="app-header">
        <Link className="brand" to="/" aria-label="AI Mystery Room home">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>AI MYSTERY ROOM</span>
        </Link>
        <span className="edition">FICTIONAL DEMO CASE</span>
      </header>
      <div className="demo-ribbon"><span aria-hidden="true">✳</span> Fixed sample case · all people and evidence are fictional</div>
      <main className="app-content">{children}</main>
      <footer className="app-footer"><span>{eyebrow}</span><span>Fictional investigation · Demo mode</span></footer>
    </div>
  );
}
