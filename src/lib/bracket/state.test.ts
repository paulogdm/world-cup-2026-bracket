import { describe, expect, it } from 'vitest';

import { MATCH_ORDER, matchById, nodeById } from './structure';
import {
  applyPick,
  champion,
  decode,
  encode,
  picksFromResults,
  resolveTeam,
  sanitize,
  type Picks
} from './state';
import { LEFT_HALF, RIGHT_HALF, type TeamId } from './teams';

// A deterministic pseudo-random generator so the property-style tests are
// reproducible (no flaky CI from a bad seed).
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a fully-decided bracket by picking a random valid side at each match. */
function randomCompletePicks(rand: () => number): Picks {
  const picks: Picks = {};
  for (const id of MATCH_ORDER) {
    const m = matchById(id);
    // Both children are always resolvable here because we fill in round order.
    picks[id] = rand() < 0.5 ? 0 : 1;
  }
  return picks;
}

describe('codec round-trip', () => {
  it('encodes an empty bracket to an empty string (bare URL)', () => {
    expect(encode({})).toBe('');
    expect(decode('')).toEqual({});
  });

  it('round-trips a single early pick', () => {
    const picks: Picks = { 'R32-01': 1 };
    expect(decode(encode(picks))).toEqual(picks);
  });

  it('round-trips random complete brackets', () => {
    const rand = mulberry32(42);
    for (let i = 0; i < 200; i++) {
      const picks = randomCompletePicks(rand);
      expect(decode(encode(picks))).toEqual(picks);
    }
  });

  it('round-trips random partial brackets (only earlier rounds)', () => {
    const rand = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      const full = randomCompletePicks(rand);
      // Keep each pick with 60% probability; sanitize away resulting orphans so
      // we compare against the canonical (resolvable) form.
      const partial: Picks = {};
      for (const id of MATCH_ORDER) if (rand() < 0.6) partial[id] = full[id];
      const canonical = sanitize(partial);
      expect(decode(encode(canonical))).toEqual(canonical);
    }
  });
});

describe('decode robustness', () => {
  it('returns an empty bracket for corrupt (non-base-36) input', () => {
    expect(decode('!!!')).toEqual({});
    expect(decode('@')).toEqual({});
  });

  it('ignores over-large magnitude beyond the match count', () => {
    // A huge value must not throw and must still yield a valid, sanitized bracket.
    const huge = (10n ** 40n).toString(36);
    expect(() => decode(huge)).not.toThrow();
  });
});

describe('sanitize', () => {
  it('drops a pick whose chosen side has no team yet (URL tampering)', () => {
    // R16-01 "decided" but its feeder R32 matches are undecided -> orphan.
    expect(sanitize({ 'R16-01': 0 })).toEqual({});
  });

  it('keeps picks that chain from a resolvable earlier round', () => {
    const picks: Picks = { 'R32-01': 0, 'R32-02': 0, 'R16-01': 0 };
    expect(sanitize(picks)).toEqual(picks);
  });
});

describe('applyPick', () => {
  it('returns null for a node with no team yet', () => {
    // The R16-01 output node holds no team until its feeders are decided.
    const outNode = matchById('R16-01').outId!;
    expect(applyPick({}, outNode)).toBeNull();
  });

  it('selects the winning side of a leaf match', () => {
    const leaf = `leaf-${LEFT_HALF[0]}`;
    const result = applyPick({}, leaf);
    expect(result).not.toBeNull();
    expect(result!.picks['R32-01']).toBe(0);
  });

  it('clicking the already-selected team de-selects it', () => {
    const leaf = `leaf-${LEFT_HALF[0]}`;
    const picked = applyPick({}, leaf)!.picks;
    const undone = applyPick(picked, leaf)!;
    expect(undone.picks['R32-01']).toBeUndefined();
  });

  it('changing an early pick clears only dependent downstream results', () => {
    // Advance R32-01 winner all the way to R16-01, plus an *independent* branch.
    let picks: Picks = {};
    picks = applyPick(picks, `leaf-${LEFT_HALF[0]}`)!.picks; // R32-01 -> side 0
    picks = applyPick(picks, `leaf-${LEFT_HALF[2]}`)!.picks; // R32-02 -> side 0
    picks = applyPick(picks, nodeById('R32-01').id)!.picks; // R16-01 consumes R32-01
    expect(picks['R16-01']).toBe(0);

    // Now flip R32-01 to the other finalist: R16-01 depended on it -> cleared.
    const flipped = applyPick(picks, `leaf-${LEFT_HALF[1]}`)!;
    expect(flipped.picks['R32-01']).toBe(1);
    expect(flipped.cleared).toContain('R16-01');
    expect(flipped.picks['R16-01']).toBeUndefined();
    // The sibling R32-02 pick is untouched.
    expect(flipped.picks['R32-02']).toBe(0);
  });
});

describe('picksFromResults', () => {
  it('derives picks from real-world winners and crowns a champion', () => {
    // Make every match resolve to the top/left input's eventual occupant.
    const results: Record<string, TeamId> = {};
    for (const id of MATCH_ORDER) {
      const top = resolveTeam(matchById(id).a, picksFromResults(results));
      if (top) results[id] = top;
    }
    const picks = picksFromResults(results);
    // Champion is the top-left leaf of whichever half feeds side 0 of the final.
    expect(champion(picks)).toBe(LEFT_HALF[0]);
  });

  it('ignores winners that are not in the match', () => {
    const stray = RIGHT_HALF[0]; // a team that cannot reach R32-01
    expect(picksFromResults({ 'R32-01': stray })).toEqual({});
  });
});
