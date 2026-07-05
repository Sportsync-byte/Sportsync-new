import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardHome } from './pages/DashboardHome';
import { CompetitionsPage } from './pages/CompetitionsPage';
import { CompetitionDetailPage } from './pages/CompetitionDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { PlayersPage } from './pages/PlayersPage';
import { LiveScoresPage } from './pages/LiveScoresPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/competitions" element={<CompetitionsPage />} />
        <Route path="/competitions/:competitionId" element={<CompetitionDetailPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/live" element={<LiveScoresPage />} />
      </Routes>
    </Layout>
  );
}
