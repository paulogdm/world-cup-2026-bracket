// Flag assets and accent colours, shared by the on-screen bracket and the
// off-screen export card. Flags are bundled from `flag-icons` as same-origin
// URLs so they rasterise cleanly when the export card is captured to an image.

import { TEAMS, type TeamId } from './teams';

// The brace list enumerates flag codes as a literal string (a static-string
// requirement of import.meta.glob), so it can silently drift from teams.ts.
// `flags.test.ts` enforces that this set is exactly the current TeamIds.
const flagModules = import.meta.glob<string>(
  '/node_modules/flag-icons/flags/1x1/{ar,at,au,ba,be,br,ca,cd,ch,ci,co,cv,de,dz,ec,eg,es,fr,gb-eng,gh,hr,jp,ma,mx,nl,no,pt,py,se,sn,us,za}.svg',
  {
    eager: true,
    import: 'default',
    query: '?url'
  }
);

const flagUrls = Object.fromEntries(
  Object.entries(flagModules).map(([path, url]) => [path.match(/\/([^/]+)\.svg$/)![1], url])
) as Record<TeamId, string>;

// Surface any gap loudly in dev; the CI test enforces the same invariant.
if (import.meta.env.DEV) {
  const missing = (Object.keys(TEAMS) as TeamId[]).filter((id) => !flagUrls[id]);
  if (missing.length) console.error('[bracket] no flag asset for:', missing.join(', '));
}

export function flagUrl(team: TeamId): string {
  return flagUrls[team];
}

export function flagAccentColor(team: TeamId): string {
  return (
    TEAMS[team].flagColors.find((color) => !['#ffffff', '#000000'].includes(color.toLowerCase())) ??
    TEAMS[team].flagColors[0]
  );
}
