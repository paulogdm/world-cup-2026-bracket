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
  'R32-01': 'py', //     Paraguay           vs Germany ✅ Paraguay won
  'R32-02': 'fr', //     France             vs Sweden  ✅ France won
  'R32-03': 'ca', //     South Africa       vs Canada  ✅ Canada won
  'R32-04': 'ma', //     Netherlands        vs Morocco  ✅ Morocco won
  // 'R32-05': 'pt',     // Portugal        vs Croatia
  // 'R32-06': 'es',     // Spain           vs Austria
  // 'R32-07': 'us',     // United States   vs Bosnia & Herzegovina
  // 'R32-08': 'be',     // Senegal         vs Belgium
  'R32-09': 'br', //     Brazil             vs Japan  ✅ Brazil won
  'R32-10': 'no', //     Côte d'Ivoire      vs Norway  ✅ Norway won
  'R32-11': 'mx', //     Mexico             vs Ecuador  ✅ Mexico won
  // 'R32-12': 'gb-eng', // England         vs DR Congo
  // 'R32-13': 'ar',     // Argentina       vs Cape Verde
  // 'R32-14': 'au',     // Australia       vs Egypt
  // 'R32-15': 'ch',     // Switzerland     vs Algeria
  // 'R32-16': 'co',     // Ghana           vs Colombia

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
