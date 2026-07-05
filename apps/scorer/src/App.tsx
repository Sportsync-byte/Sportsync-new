import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MatchSelectPage } from './pages/MatchSelectPage';
import { MatchRouter } from './pages/MatchRouter';
import { DisplayRouter } from './pages/DisplayRouter';
import { LoginPage } from './pages/LoginPage';
import { getAuthToken } from './lib/auth';

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getAuthToken()));

  if (!authed) {
    return <LoginPage onLogin={() => setAuthed(true)} />;
  }

  return (
    <Routes>
      <Route path="/" element={<MatchSelectPage />} />
      <Route path="/match/:matchId" element={<MatchRouter />} />
      <Route path="/display/:matchId" element={<DisplayRouter />} />
    </Routes>
  );
}
