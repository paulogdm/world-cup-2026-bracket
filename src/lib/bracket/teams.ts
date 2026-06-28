// The 32 teams of the (illustrative) World Cup 2026 knockout bracket.
//
// `TeamId` is the flag-icons code used to render the flag (ISO 3166-1
// alpha-2, lowercase; England uses the `gb-eng` subdivision code).
// These ids are also what you reference in `config.ts` when recording
// real-world results.

export type TeamId = string;
export type FlagColorPalette = [string, string, string] | [string, string, string, string];

export interface Team {
  id: TeamId;
  name: string;
  flagColors: FlagColorPalette;
}

export const TEAMS: Record<TeamId, Team> = {
  py: { id: 'py', name: 'Paraguay', flagColors: ['#d52b1e', '#ffffff', '#0038a8'] },
  de: { id: 'de', name: 'Germany', flagColors: ['#000000', '#dd0000', '#ffce00'] },
  fr: { id: 'fr', name: 'France', flagColors: ['#0055a4', '#ffffff', '#ef4135'] },
  se: { id: 'se', name: 'Sweden', flagColors: ['#006aa7', '#fecc00', '#006aa7'] },
  za: { id: 'za', name: 'South Africa', flagColors: ['#007a4d', '#ffb612', '#de3831', '#002395'] },
  ca: { id: 'ca', name: 'Canada', flagColors: ['#ff0000', '#ffffff', '#ff0000'] },
  nl: { id: 'nl', name: 'Netherlands', flagColors: ['#ae1c28', '#ffffff', '#21468b'] },
  ma: { id: 'ma', name: 'Morocco', flagColors: ['#c1272d', '#006233', '#c1272d'] },
  pt: { id: 'pt', name: 'Portugal', flagColors: ['#006600', '#ff0000', '#ffcc00'] },
  hr: { id: 'hr', name: 'Croatia', flagColors: ['#ff0000', '#ffffff', '#171796', '#0093dd'] },
  es: { id: 'es', name: 'Spain', flagColors: ['#aa151b', '#f1bf00', '#aa151b'] },
  at: { id: 'at', name: 'Austria', flagColors: ['#ed2939', '#ffffff', '#ed2939'] },
  us: { id: 'us', name: 'United States', flagColors: ['#b22234', '#ffffff', '#3c3b6e'] },
  ba: { id: 'ba', name: 'Bosnia & Herzegovina', flagColors: ['#002395', '#fecb00', '#ffffff'] },
  sn: { id: 'sn', name: 'Senegal', flagColors: ['#00853f', '#fdef42', '#e31b23'] },
  be: { id: 'be', name: 'Belgium', flagColors: ['#000000', '#fae042', '#ed2939'] },
  br: { id: 'br', name: 'Brazil', flagColors: ['#009b3a', '#ffdf00', '#002776', '#ffffff'] },
  jp: { id: 'jp', name: 'Japan', flagColors: ['#bc002d', '#ffffff', '#bc002d'] },
  ci: { id: 'ci', name: "Côte d'Ivoire", flagColors: ['#f77f00', '#ffffff', '#009e60'] },
  no: { id: 'no', name: 'Norway', flagColors: ['#ba0c2f', '#ffffff', '#00205b'] },
  mx: { id: 'mx', name: 'Mexico', flagColors: ['#006847', '#ffffff', '#ce1126'] },
  ec: { id: 'ec', name: 'Ecuador', flagColors: ['#ffdd00', '#034ea2', '#ed1c24'] },
  'gb-eng': { id: 'gb-eng', name: 'England', flagColors: ['#ffffff', '#cf142b', '#ffffff'] },
  cd: { id: 'cd', name: 'DR Congo', flagColors: ['#007fff', '#f7d618', '#ce1021'] },
  ar: { id: 'ar', name: 'Argentina', flagColors: ['#74acdf', '#ffffff', '#f6b40e'] },
  cv: { id: 'cv', name: 'Cape Verde', flagColors: ['#003893', '#ffffff', '#cf2027', '#f7d116'] },
  au: { id: 'au', name: 'Australia', flagColors: ['#00008b', '#ffffff', '#ff0000'] },
  eg: { id: 'eg', name: 'Egypt', flagColors: ['#ce1126', '#ffffff', '#000000', '#c09300'] },
  ch: { id: 'ch', name: 'Switzerland', flagColors: ['#ff0000', '#ffffff', '#ff0000'] },
  dz: { id: 'dz', name: 'Algeria', flagColors: ['#006233', '#ffffff', '#d21034'] },
  gh: { id: 'gh', name: 'Ghana', flagColors: ['#ce1126', '#fcd116', '#006b3f', '#000000'] },
  co: { id: 'co', name: 'Colombia', flagColors: ['#fcd116', '#003893', '#ce1126'] }
};

// Round-of-32 seeding, read off the poster. Each half collapses inward to a
// semifinalist; the two semifinalists meet in the final at the centre trophy.
// Order matters: adjacent pairs (0,1) (2,3) ... are the first-round matches,
// listed from the top seam down to the bottom seam.
export const LEFT_HALF: TeamId[] = [
  'py', 'de', // R32-01  Paraguay vs Germany
  'fr', 'se', // R32-02  France vs Sweden
  'za', 'ca', // R32-03  South Africa vs Canada
  'nl', 'ma', // R32-04  Netherlands vs Morocco
  'pt', 'hr', // R32-05  Portugal vs Croatia
  'es', 'at', // R32-06  Spain vs Austria
  'us', 'ba', // R32-07  United States vs Bosnia & Herzegovina
  'sn', 'be' //  R32-08  Senegal vs Belgium
];

export const RIGHT_HALF: TeamId[] = [
  'br', 'jp', //      R32-09  Brazil vs Japan
  'ci', 'no', //      R32-10  Côte d'Ivoire vs Norway
  'mx', 'ec', //      R32-11  Mexico vs Ecuador
  'gb-eng', 'cd', //  R32-12  England vs DR Congo
  'ar', 'cv', //      R32-13  Argentina vs Cape Verde
  'au', 'eg', //      R32-14  Australia vs Egypt
  'ch', 'dz', //      R32-15  Switzerland vs Algeria
  'gh', 'co' //       R32-16  Ghana vs Colombia
];
