import { Link } from 'react-router-dom';

export default function AppShell({ children, eyebrow = 'THE CASE DESK' }) {
  return (
    <div className="app-frame page-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="app-header">
        <Link className="brand" to="/" aria-label="TraceBit home">
          <span className="brand-mark" aria-hidden="true">✳</span>
          <span>TRACEBIT</span>
        </Link>
        <nav className="app-nav" aria-label="Main navigation"><Link to="/history">Case history</Link></nav>
        <span className="edition">FICTIONAL INVESTIGATION</span>
      </header>
      <div className="demo-ribbon"><span aria-hidden="true">✳</span> All cases and evidence are fictional simulations</div>
      <main className="app-content" id="main-content">{children}</main>
      <footer className="app-footer"><span>{eyebrow}</span><span>Fictional investigation · Generated or sample case</span></footer>
    </div>
  );
}
