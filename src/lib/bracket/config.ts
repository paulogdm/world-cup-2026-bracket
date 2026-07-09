// ───────────────────────────────────────────────────────────────────────────
//  EDIT ME — this is your control panel.
// ───────────────────────────────────────────────────────────────────────────
//
//  `defaultResults` records REAL-WORLD outcomes. When someone opens the app
//  without a shared bracket in the URL (no `?b=...`), the bracket starts from
//  these results — so as the actual tournament progresses, just fill them in
//  here and redeploy, and the live default keeps pace.
//
//  Format:   '<matchId>': '<winningTeamId>'
//  Team ids are the flag codes from `teams.ts` (e.g. 'br' = Brazil,
//  'gb-eng' = England). Fill matches in round order; a later round only
//  resolves once the matches feeding it are filled. Anything left out (or that
//  doesn't match the current participants) is simply treated as "not yet
//  played" and stays clickable.
//
//  The full fixture list is below as a reference — uncomment and set winners.

import type { TeamId } from './teams';

export const TITLE = 'World Cup 2026';

export const defaultResults: Record<string, TeamId> = {
  // ── Round of 32 ──────────────────────────────────────────────────────────
  //  "ends ~<UTC>" is kickoff + 2h — the earliest a normal-time result is
  //  expected. Don't record a winner until the current UTC time is past that
  //  stamp (extra time / penalties can push the real finish later still).
  //  Kickoffs from the official schedule (SI.com / Wikipedia); EDT = UTC−4.
  'R32-01': 'py',       //  Paraguay        vs Germany         ends ~2026-06-29T22:30Z  ✅ Paraguay won
  'R32-02': 'fr',       //  France          vs Sweden          ends ~2026-06-30T23:00Z  ✅ France won
  'R32-03': 'ca',       //  South Africa    vs Canada          ends ~2026-06-28T21:00Z  ✅ Canada won
  'R32-04': 'ma',       //  Netherlands     vs Morocco         ends ~2026-06-30T03:00Z  ✅ Morocco won
  'R32-05': 'pt',       //  Portugal        vs Croatia         ends ~2026-07-03T01:00Z  ✅ Portugal won
  'R32-06': 'es',       //  Spain           vs Austria         ends ~2026-07-02T21:00Z  ✅ Spain won
  'R32-07': 'us',       //  United States   vs Bosnia & Herz.  ends ~2026-07-02T02:00Z  ✅ United States won
  'R32-08': 'be',       //  Senegal         vs Belgium         ends ~2026-07-01T22:00Z  ✅ Belgium won
  'R32-09': 'br',       //  Brazil          vs Japan           ends ~2026-06-29T19:00Z  ✅ Brazil won
  'R32-10': 'no',       //  Côte d'Ivoire   vs Norway          ends ~2026-06-30T19:00Z  ✅ Norway won
  'R32-11': 'mx',       //  Mexico          vs Ecuador         ends ~2026-07-01T03:00Z  ✅ Mexico won
  'R32-12': 'gb-eng',   //  England         vs DR Congo        ends ~2026-07-01T18:00Z  ✅ England won
  'R32-13': 'ar',       //  Argentina       vs Cape Verde      ends ~2026-07-04T00:00Z  ✅ Argentina won
  'R32-14': 'eg',       //  Australia       vs Egypt           ends ~2026-07-03T20:00Z  ✅ Egypt won
  'R32-15': 'ch',       //  Switzerland     vs Algeria         ends ~2026-07-03T05:00Z  ✅ Switzerland won
  'R32-16': 'co',       //  Ghana           vs Colombia        ends ~2026-07-04T03:30Z  ✅ Colombia won

  // ── Round of 16 ──────────────────────────────────────────────────────────
  'R16-01': 'fr',  // Paraguay vs France   ends ~2026-07-04T23:00Z  ✅ France won
  'R16-02': 'ma',  // Canada vs Morocco   ends ~2026-07-04T19:00Z  ✅ Morocco won
  'R16-03': 'es',  // Portugal vs Spain   plays 2026-07-06 (kickoff TBD)  ✅ Spain won
  'R16-04': 'be',  // United States vs Belgium   plays 2026-07-06 (kickoff TBD)  ✅ Belgium won
  'R16-05': 'no',  // Brazil vs Norway   ends ~2026-07-05T22:00Z  ✅ Norway won
  'R16-06': 'gb-eng',  // Mexico vs England   ends ~2026-07-06T02:00Z  ✅ England won
  'R16-07': 'ar',  // Argentina vs Egypt   ends ~2026-07-07T18:00Z  ✅ Argentina won
  'R16-08': 'ch',  // Switzerland vs Colombia   ends ~2026-07-07T22:00Z  ✅ Switzerland won

  // ── Quarter-finals ───────────────────────────────────────────────────────
  'QF-01': 'fr',  // France vs Morocco   ends ~2026-07-09T22:00Z  ✅ France won
  // 'QF-02': '',  // winner R16-03 vs winner R16-04
  // 'QF-03': '',  // winner R16-05 vs winner R16-06
  // 'QF-04': '',  // winner R16-07 vs winner R16-08

  // ── Semi-finals ──────────────────────────────────────────────────────────
  // 'SF-01': '',  // winner QF-01 vs winner QF-02  (left finalist)
  // 'SF-02': '',  // winner QF-03 vs winner QF-04  (right finalist)

  // ── Final ────────────────────────────────────────────────────────────────
  // 'F': ''       // winner SF-01 vs winner SF-02
};

// ───────────────────────────────────────────────────────────────────────────
//  MATCH SCORES — the real final scores, kept for posterity.
// ───────────────────────────────────────────────────────────────────────────
//
//  These are canonical, real-world results. Unlike winner picks, scores never
//  travel in the shared `?b=...` URL (that encodes winners only) — they live
//  only here. A score is drawn on the bracket ONLY while the match still shows
//  the two teams that actually played it; if someone re-picks an earlier round
//  so the matchup changes, its score hides rather than being stamped onto a
//  pairing that never happened.
//
//  Format:   '<matchId>': '<winnerGoals>-<loserGoals>'
//  The score counts goals scored in play (90 min + extra time), written
//  winner-first — the winner is taken from `defaultResults` above, so the
//  renderer knows which flag each number belongs to. A match settled on
//  penalties keeps its drawn scoreline (e.g. '1-1'), with the shootout noted in
//  the comment; the winner still comes from `defaultResults`. A score with no
//  recorded winner (or that doesn't match the current teams) is ignored.
//
//  Real results, verified against FIFA, ESPN, Wikipedia and Al Jazeera reports.

export const matchScores: Record<string, string> = {
  // ── Round of 32 ──────────────────────────────────────────────────────────
  'R32-01': '1-1', //  Paraguay beat Germany (4-3 on penalties)
  'R32-02': '3-0', //  France beat Sweden
  'R32-03': '1-0', //  Canada beat South Africa
  'R32-04': '1-1', //  Morocco beat Netherlands (3-2 on penalties)
  'R32-05': '2-1', //  Portugal beat Croatia
  'R32-06': '3-0', //  Spain beat Austria
  'R32-07': '2-0', //  United States beat Bosnia & Herz.
  'R32-08': '3-2', //  Belgium beat Senegal (after extra time)
  'R32-09': '2-1', //  Brazil beat Japan
  'R32-10': '2-1', //  Norway beat Côte d'Ivoire
  'R32-11': '2-0', //  Mexico beat Ecuador
  'R32-12': '2-1', //  England beat DR Congo
  'R32-13': '3-2', //  Argentina beat Cape Verde (after extra time)
  'R32-14': '1-1', //  Egypt beat Australia (4-2 on penalties)
  'R32-15': '2-0', //  Switzerland beat Algeria
  'R32-16': '1-0', //  Colombia beat Ghana

  // ── Round of 16 ──────────────────────────────────────────────────────────
  'R16-01': '1-0', //  France beat Paraguay
  'R16-02': '3-0', //  Morocco beat Canada
  'R16-03': '1-0', //  Spain beat Portugal (Mikel Merino 90+1' — Ronaldo's last World Cup match)
  'R16-04': '4-1', //  Belgium beat United States
  'R16-05': '2-1', //  Norway beat Brazil
  'R16-06': '3-2', //  England beat Mexico (Bellingham ×2, Kane pen; Quiñones, Jiménez pen)
  'R16-07': '3-2', //  Argentina beat Egypt
  'R16-08': '0-0', //  Switzerland beat Colombia (on penalties)

  // ── Quarter-finals ───────────────────────────────────────────────────────
  'QF-01': '2-1'  //  France beat Morocco
};
