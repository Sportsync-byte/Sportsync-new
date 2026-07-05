import { recordBall, undoLastBall, createMatch, setBatters, setBowler } from './engine.js';
import { INDOOR_CRICKET_FORMATS } from '@sportsync/shared';

describe('indoor cricket scoring engine', () => {
  const format = INDOOR_CRICKET_FORMATS['six-aside'];

  function setupMatch() {
    const state = createMatch('m1', 'f1', 'team-home', 'team-away', format);
    let updated = setBatters(state, 'batter-1', 'batter-2');
    updated = setBowler(updated, 'bowler-1');
    return updated;
  }

  it('records runs and advances the over', () => {
    const state = setupMatch();
    const updated = recordBall(state, { runs: 4 });

    expect(updated.innings[0].totalRuns).toBe(4);
    expect(updated.innings[0].ballsInOver).toBe(1);
    expect(updated.status).toBe('innings-1');
  });

  it('applies dismissal penalty', () => {
    const state = setupMatch();
    const updated = recordBall(state, {
      runs: 0,
      dismissal: { type: 'bowled', batterId: 'batter-1' },
    });

    expect(updated.innings[0].totalRuns).toBe(-5);
    expect(updated.innings[0].wickets).toBe(1);
  });

  it('does not advance over on wides', () => {
    const state = setupMatch();
    const updated = recordBall(state, {
      runs: 0,
      extra: { type: 'wide', runs: 1 },
    });

    expect(updated.innings[0].totalRuns).toBe(1);
    expect(updated.innings[0].ballsInOver).toBe(0);
  });

  it('rotates strike on odd runs', () => {
    const state = setupMatch();
    const updated = recordBall(state, { runs: 1 });

    expect(updated.innings[0].strikerId).toBe('batter-2');
    expect(updated.innings[0].nonStrikerId).toBe('batter-1');
  });

  it('undoes the last ball', () => {
    const state = setupMatch();
    const afterBall = recordBall(state, { runs: 4 });
    const undone = undoLastBall(afterBall);

    expect(undone.innings[0].totalRuns).toBe(0);
    expect(undone.innings[0].ballHistory).toHaveLength(0);
  });

  it('starts innings when bowler is set', () => {
    const state = createMatch('m1', 'f1', 'team-home', 'team-away', format);
    const withBatters = setBatters(state, 'b1', 'b2');
    const withBowler = setBowler(withBatters, 'bowler-1');
    expect(withBowler.status).toBe('innings-1');
    expect(withBowler.pendingPrompt).toBeNull();
  });
});
