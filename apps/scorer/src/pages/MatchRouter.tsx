import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@sportsync/api-client';
import { routeScoringPage } from '../lib/sport-routing';
import { ScoringPage } from './ScoringPage';
import { NetballScoringPage } from './NetballScoringPage';
import { FootballScoringPage } from './FootballScoringPage';
import { BasketballScoringPage } from './BasketballScoringPage';
import { TouchRugbyScoringPage } from './TouchRugbyScoringPage';

export function MatchRouter() {
  const { matchId } = useParams<{ matchId: string }>();
  const [sport, setSport] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;
    api.matches.get(matchId).then((doc) => {
      const match = doc as { sport?: string };
      setSport(match.sport || 'indoor-cricket');
    });
  }, [matchId]);

  if (!sport) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading match...</div>;

  const engine = routeScoringPage(sport);
  if (engine === 'indoor-netball') return <NetballScoringPage />;
  if (engine === 'indoor-football') return <FootballScoringPage />;
  if (engine === 'basketball') return <BasketballScoringPage />;
  if (engine === 'touch-rugby') return <TouchRugbyScoringPage />;
  return <ScoringPage />;
}
