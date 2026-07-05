import { Routes, Route } from 'react-router-dom';
import { MatchSelectPage } from './pages/MatchSelectPage';
import { MatchRouter } from './pages/MatchRouter';
import { DisplayRouter } from './pages/DisplayRouter';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MatchSelectPage />} />
      <Route path="/match/:matchId" element={<MatchRouter />} />
      <Route path="/display/:matchId" element={<DisplayRouter />} />
    </Routes>
  );
}
