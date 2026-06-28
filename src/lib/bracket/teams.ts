// The 32 teams of the (illustrative) World Cup 2026 knockout bracket.
//
// `TeamId` is the flag-icons code used to render the flag (ISO 3166-1
// alpha-2, lowercase; England uses the `gb-eng` subdivision code).
// These ids are also what you reference in `config.ts` when recording
// real-world results.

export type TeamId = string;

export interface Team {
  id: TeamId;
  name: string;
}

export const TEAMS: Record<TeamId, Team> = {
  py: { id: 'py', name: 'Paraguay' },
  de: { id: 'de', name: 'Germany' },
  fr: { id: 'fr', name: 'France' },
  se: { id: 'se', name: 'Sweden' },
  za: { id: 'za', name: 'South Africa' },
  ca: { id: 'ca', name: 'Canada' },
  nl: { id: 'nl', name: 'Netherlands' },
  ma: { id: 'ma', name: 'Morocco' },
  pt: { id: 'pt', name: 'Portugal' },
  hr: { id: 'hr', name: 'Croatia' },
  es: { id: 'es', name: 'Spain' },
  at: { id: 'at', name: 'Austria' },
  us: { id: 'us', name: 'United States' },
  ba: { id: 'ba', name: 'Bosnia & Herzegovina' },
  sn: { id: 'sn', name: 'Senegal' },
  be: { id: 'be', name: 'Belgium' },
  br: { id: 'br', name: 'Brazil' },
  jp: { id: 'jp', name: 'Japan' },
  ci: { id: 'ci', name: "Côte d'Ivoire" },
  no: { id: 'no', name: 'Norway' },
  mx: { id: 'mx', name: 'Mexico' },
  ec: { id: 'ec', name: 'Ecuador' },
  'gb-eng': { id: 'gb-eng', name: 'England' },
  cd: { id: 'cd', name: 'DR Congo' },
  ar: { id: 'ar', name: 'Argentina' },
  cv: { id: 'cv', name: 'Cape Verde' },
  au: { id: 'au', name: 'Australia' },
  eg: { id: 'eg', name: 'Egypt' },
  ch: { id: 'ch', name: 'Switzerland' },
  dz: { id: 'dz', name: 'Algeria' },
  gh: { id: 'gh', name: 'Ghana' },
  co: { id: 'co', name: 'Colombia' }
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
