import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell.jsx';

export default function HistoryPage() {
  return <AppShell eyebrow="CASE HISTORY"><section className="error-panel"><p className="eyebrow">NO SAVED CASES</p><h1>History comes later.</h1><p>This demo keeps its play session in memory and does not save a case library. Persistent case history is planned for the database milestone.</p><Link className="primary-link" to="/cases/demo-case-001"><span>Open the sample case</span><span aria-hidden="true">↗</span></Link></section></AppShell>;
}
