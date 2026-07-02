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
  // 'R32-13': 'ar',    //  Argentina       vs Cape Verde      ends ~2026-07-04T00:00Z
  // 'R32-14': 'au',    //  Australia       vs Egypt           ends ~2026-07-03T20:00Z
  // 'R32-15': 'ch',    //  Switzerland     vs Algeria         ends ~2026-07-03T05:00Z
  // 'R32-16': 'co',    //  Ghana           vs Colombia        ends ~2026-07-04T03:30Z

  // ── Round of 16 ──────────────────────────────────────────────────────────
  // 'R16-01': '',  // winner R32-01 vs winner R32-02
  // 'R16-02': '',  // winner R32-03 vs winner R32-04
  // 'R16-03': '',  // winner R32-05 vs winner R32-06
  // 'R16-04': '',  // winner R32-07 vs winner R32-08
  // 'R16-05': '',  // winner R32-09 vs winner R32-10
  // 'R16-06': '',  // winner R32-11 vs winner R32-12
  // 'R16-07': '',  // winner R32-13 vs winner R32-14
  // 'R16-08': '',  // winner R32-15 vs winner R32-16

  // ── Quarter-finals ───────────────────────────────────────────────────────
  // 'QF-01': '',  // winner R16-01 vs winner R16-02
  // 'QF-02': '',  // winner R16-03 vs winner R16-04
  // 'QF-03': '',  // winner R16-05 vs winner R16-06
  // 'QF-04': '',  // winner R16-07 vs winner R16-08

  // ── Semi-finals ──────────────────────────────────────────────────────────
  // 'SF-01': '',  // winner QF-01 vs winner QF-02  (left finalist)
  // 'SF-02': '',  // winner QF-03 vs winner QF-04  (right finalist)

  // ── Final ────────────────────────────────────────────────────────────────
  // 'F': ''       // winner SF-01 vs winner SF-02
};
