// Flag assets and accent colours, shared by the on-screen bracket and the
// off-screen export card. Flags are bundled from `flag-icons` as same-origin
// URLs so they rasterise cleanly when the card is captured to an image.

import { TEAMS, type TeamId } from './teams';

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

export function flagUrl(team: TeamId): string {
  return flagUrls[team];
}

export function flagAccentColor(team: TeamId): string {
  return (
    TEAMS[team].flagColors.find((color) => !['#ffffff', '#000000'].includes(color.toLowerCase())) ??
    TEAMS[team].flagColors[0]
  );
}
