import { Route, Routes } from 'react-router-dom';
import LandingPage from '../pages/LandingPage.jsx';
import CreateCasePage from '../pages/CreateCasePage.jsx';
import CaseBriefPage from '../pages/CaseBriefPage.jsx';
import InvestigationPage from '../pages/InvestigationPage.jsx';
import ResultPage from '../pages/ResultPage.jsx';
import HistoryPage from '../pages/HistoryPage.jsx';

function NotFoundPage() {
  return <main className="page-shell not-found"><p className="eyebrow">404 · FILE NOT FOUND</p><h1>This page isn’t in the case file.</h1><a className="primary-link" href="/"><span>Return to the case desk</span><span aria-hidden="true">↗</span></a></main>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/create" element={<CreateCasePage />} />
      <Route path="/cases/:caseId" element={<CaseBriefPage />} />
      <Route path="/cases/:caseId/investigate" element={<InvestigationPage />} />
      <Route path="/cases/:caseId/result" element={<ResultPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
