import { generateRoundRobinFixtures } from './fixtures.js';

describe('generateRoundRobinFixtures', () => {
  it('assigns courts in round-robin order', () => {
    const fixtures = generateRoundRobinFixtures(
      ['t1', 't2', 't3', 't4'],
      'comp1',
      'default',
      {
        startDate: '2026-01-01T18:00:00.000Z',
        courtIds: ['court-a', 'court-b'],
        slotMinutes: 60,
      }
    );

    const round1 = fixtures.filter((f) => f.round === 1);
    expect(round1).toHaveLength(2);
    expect(round1[0].courtId).toBe('court-a');
    expect(round1[1].courtId).toBe('court-b');
    expect(round1[0].scheduledAt).toBe(round1[1].scheduledAt);
  });

  it('staggers extra matches when more fixtures than courts in a round', () => {
    const fixtures = generateRoundRobinFixtures(
      ['t1', 't2', 't3', 't4', 't5', 't6'],
      'comp1',
      'default',
      {
        startDate: '2026-01-01T18:00:00.000Z',
        courtIds: ['court-a', 'court-b'],
        slotMinutes: 60,
      }
    );

    const round1 = fixtures.filter((f) => f.round === 1);
    expect(round1).toHaveLength(3);
    expect(round1[2].scheduledAt).not.toBe(round1[0].scheduledAt);
  });
});
