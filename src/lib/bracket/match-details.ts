// ───────────────────────────────────────────────────────────────────────────
//  MATCH DETAILS — the story of each played match, for the detail card.
// ───────────────────────────────────────────────────────────────────────────
//
//  Clicking a score pill opens a card describing that match. This is the data
//  behind it, keyed by the same `matchId` used everywhere else.
//
//  IMPORTANT — what's real here and what isn't:
//    • `kickoff` and `venue` describe a REAL slot in the official 2026 schedule
//      (a real stadium, city and date/time). They are facts about the fixture.
//    • Everything about *what happened* in the match — who scored, extra time,
//      the shootout — is part of this app's fabricated result set (the 2026
//      knockout stage hasn't been played), exactly like the scores in
//      `config.ts`. We only record what's already written down as canonical in
//      `config.ts`; we don't invent new detail.
//
//  Every field is optional. The card renders a section ONLY when its data is
//  present, so a sparse entry (or no entry at all) is fine — it just shows less.
//  Fill fields in as they become known and the card fills out with them.
//
//  ── How to add a VENUE ─────────────────────────────────────────────────────
//  Venues are intentionally left blank: mapping each fabricated matchup to its
//  real scheduled stadium couldn't be verified, and an unverified venue is worse
//  than none. To add one you've confirmed against the official schedule:
//      'R32-09': { ...existing, venue: { stadium: 'MetLife Stadium', city: 'East Rutherford' } },
//
//  ── Times ──────────────────────────────────────────────────────────────────
//  `kickoff` is an ISO-8601 UTC instant. The card formats it in the visitor's
//  own timezone and locale at render time. The stamps below are the official
//  kickoffs (the "ends ~<UTC>" notes in config.ts are kickoff + 2h, so these are
//  those stamps minus two hours).

/** A real stadium and its host city. */
export interface Venue {
  stadium: string;
  city: string;
}

/** A single goal, attributed to the match's winner or loser side. */
export interface Goal {
  /** Which team scored — resolved to a name by the card from the recorded winner. */
  team: 'winner' | 'loser';
  /** Scorer's name. */
  scorer: string;
  /** Minute of the goal (90 min + stoppage/extra time), when known. */
  minute?: number;
  /** True if the goal was a penalty kick in open play (not the shootout). */
  penalty?: boolean;
}

export interface MatchDetail {
  /** Where it was played — a real scheduled stadium and city. */
  venue?: Venue;
  /** Kick-off as an ISO-8601 UTC instant; formatted in the visitor's timezone. */
  kickoff?: string;
  /** True if the match went to extra time (prorrogação) before finishing. */
  extraTime?: boolean;
  /** Shootout aggregate, winner-first, when the match was decided on penalties. */
  penalties?: { winner: number; loser: number };
  /** Goals in order, attributed to winner/loser; empty/absent when unknown. */
  goals?: Goal[];
}

//  Kick-offs are transcribed from the official-schedule notes in config.ts
//  (minus the 2h "ends" offset). Extra-time and penalty aggregates are the
//  canonical results already recorded in config.ts comments. Goals are only
//  filled where config.ts already names the scorers (currently just R16-06).
export const matchDetails: Record<string, MatchDetail> = {
  // ── Round of 32 ──────────────────────────────────────────────────────────
  'R32-01': { kickoff: '2026-06-29T20:30:00Z', extraTime: true, penalties: { winner: 4, loser: 3 } }, // Paraguay beat Germany on penalties
  'R32-02': { kickoff: '2026-06-30T21:00:00Z' }, // France 3–0 Sweden
  'R32-03': { kickoff: '2026-06-28T19:00:00Z' }, // Canada 1–0 South Africa
  'R32-04': { kickoff: '2026-06-30T01:00:00Z', extraTime: true, penalties: { winner: 3, loser: 2 } }, // Morocco beat Netherlands on penalties
  'R32-05': { kickoff: '2026-07-02T23:00:00Z' }, // Portugal 2–1 Croatia
  'R32-06': { kickoff: '2026-07-02T19:00:00Z' }, // Spain 3–0 Austria
  'R32-07': { kickoff: '2026-07-02T00:00:00Z' }, // United States 2–0 Bosnia & Herz.
  'R32-08': { kickoff: '2026-07-01T20:00:00Z', extraTime: true }, // Belgium 3–2 Senegal (after extra time)
  'R32-09': { kickoff: '2026-06-29T17:00:00Z' }, // Brazil 2–1 Japan
  'R32-10': { kickoff: '2026-06-30T17:00:00Z' }, // Norway 2–1 Côte d'Ivoire
  'R32-11': { kickoff: '2026-07-01T01:00:00Z' }, // Mexico 2–0 Ecuador
  'R32-12': { kickoff: '2026-07-01T16:00:00Z' }, // England 2–1 DR Congo
  'R32-13': { kickoff: '2026-07-03T22:00:00Z', extraTime: true }, // Argentina 3–2 Cape Verde (after extra time)
  'R32-14': { kickoff: '2026-07-03T18:00:00Z', extraTime: true, penalties: { winner: 4, loser: 2 } }, // Egypt beat Australia on penalties
  'R32-15': { kickoff: '2026-07-03T03:00:00Z' }, // Switzerland 2–0 Algeria
  'R32-16': { kickoff: '2026-07-04T01:30:00Z' }, // Colombia 1–0 Ghana

  // ── Round of 16 ──────────────────────────────────────────────────────────
  'R16-01': { kickoff: '2026-07-04T21:00:00Z' }, // France 1–0 Paraguay
  'R16-02': { kickoff: '2026-07-04T17:00:00Z' }, // Morocco 3–0 Canada
  'R16-05': { kickoff: '2026-07-05T20:00:00Z' }, // Norway 2–1 Brazil
  'R16-06': {
    kickoff: '2026-07-06T00:00:00Z', // England 3–2 Mexico
    goals: [
      { team: 'winner', scorer: 'Bellingham' },
      { team: 'winner', scorer: 'Bellingham' },
      { team: 'winner', scorer: 'Kane', penalty: true },
      { team: 'loser', scorer: 'Quiñones' },
      { team: 'loser', scorer: 'Jiménez', penalty: true }
    ]
  }
};

/** Detail for a match, if any is recorded. */
export function matchDetailFor(matchId: string): MatchDetail | undefined {
  return matchDetails[matchId];
}
