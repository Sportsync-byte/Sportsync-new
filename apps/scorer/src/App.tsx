import { Routes, Route } from 'react-router-dom';
import { MatchSelectPage } from './pages/MatchSelectPage';
import { ScoringPage } from './pages/ScoringPage';
import { ScoreboardDisplayPage } from './pages/ScoreboardDisplayPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MatchSelectPage />} />
      <Route path="/match/:matchId" element={<ScoringPage />} />
      <Route path="/display/:matchId" element={<ScoreboardDisplayPage />} />
    </Routes>
  );
}
