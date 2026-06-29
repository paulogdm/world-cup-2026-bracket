import { describe, expect, it } from 'vitest';

import {
  allNodes,
  connectors,
  finalChildren,
  MATCH_ORDER,
  matchById,
  nodeById,
  ROUND_ORDER,
  type Round
} from './structure';
import { LEFT_HALF, RIGHT_HALF, TEAMS, type TeamId } from './teams';

// These invariants are cheap and deterministic — the bracket is built from the
// seeding in `teams.ts` at module load, so any refactor that warps the tree
// shape (a dropped match, a mis-ordered round, a stray connector) fails here.

const matches = MATCH_ORDER.map(matchById);

describe('match counts', () => {
  const perRound: Record<Round, number> = { R32: 16, R16: 8, QF: 4, SF: 2, F: 1 };

  it('has 31 matches total (16 + 8 + 4 + 2 + 1)', () => {
    expect(MATCH_ORDER).toHaveLength(31);
  });

  for (const round of ROUND_ORDER) {
    it(`has ${perRound[round]} ${round} match(es)`, () => {
      expect(matches.filter((m) => m.round === round)).toHaveLength(perRound[round]);
    });
  }

  it('has no duplicate match ids', () => {
    expect(new Set(MATCH_ORDER).size).toBe(MATCH_ORDER.length);
  });
});

describe('node and connector counts', () => {
  it('has 62 nodes (32 leaves + 30 match outputs)', () => {
    // The final has no output node — its winner lands on the centre trophy
    // (`F.outId === null`) — so only 30 of the 31 matches contribute a node.
    expect(allNodes).toHaveLength(62);
    expect(allNodes.filter((n) => n.kind === 'leaf')).toHaveLength(32);
    expect(allNodes.filter((n) => n.kind === 'match')).toHaveLength(30);
  });

  it('has 62 connectors (two branches per match)', () => {
    expect(connectors).toHaveLength(62);
    expect(connectors).toHaveLength(matches.length * 2);
  });
});

describe('tree ordering and shape', () => {
  it('orders every match after the matches that feed it', () => {
    const position = new Map(MATCH_ORDER.map((id, i) => [id, i]));
    for (const m of matches) {
      for (const childId of [m.a, m.b]) {
        const child = nodeById(childId);
        if (child.kind === 'match') {
          expect(position.get(child.id)!).toBeLessThan(position.get(m.id)!);
        }
      }
    }
  });

  it('only the final has no output node (champion is the centre trophy)', () => {
    const headless = matches.filter((m) => m.outId === null);
    expect(headless).toHaveLength(1);
    expect(headless[0].id).toBe('F');
    expect(matchById('F').outId).toBeNull();
  });

  it('wires the final to the two semifinalists', () => {
    const final = matchById('F');
    expect([final.a, final.b]).toEqual(finalChildren);
  });
});

describe('seeding covers every team exactly once', () => {
  // Bonus guard related to the flag-dedup work (#28): the two halves must
  // partition the full team list with no overlaps and no omissions.
  it('LEFT_HALF and RIGHT_HALF together are exactly the 32 teams', () => {
    const halves = [...LEFT_HALF, ...RIGHT_HALF];
    expect(halves).toHaveLength(32);
    expect(new Set(halves).size).toBe(32);
    expect(new Set(halves)).toEqual(new Set(Object.keys(TEAMS) as TeamId[]));
  });

  it('binds one leaf node per team', () => {
    const leafTeams = allNodes
      .filter((n) => n.kind === 'leaf')
      .map((n) => n.team)
      .sort();
    expect(leafTeams).toEqual((Object.keys(TEAMS) as TeamId[]).sort());
  });
});
