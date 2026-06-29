// Localized country names. English is the source of truth in `teams.ts`; this
// module overlays Portuguese (Brazil) and Spanish names. `localizedTeamName`
// falls back to the English name for any locale/team without an override.

import { TEAMS, type TeamId } from '$lib/bracket/teams';
import type { Locale } from './locales';

type Overrides = Partial<Record<TeamId, string>>;

const PT_BR: Overrides = {
  py: 'Paraguai',
  de: 'Alemanha',
  fr: 'França',
  se: 'Suécia',
  za: 'África do Sul',
  ca: 'Canadá',
  nl: 'Países Baixos',
  ma: 'Marrocos',
  pt: 'Portugal',
  hr: 'Croácia',
  es: 'Espanha',
  at: 'Áustria',
  us: 'Estados Unidos',
  ba: 'Bósnia e Herzegovina',
  sn: 'Senegal',
  be: 'Bélgica',
  br: 'Brasil',
  jp: 'Japão',
  ci: 'Costa do Marfim',
  no: 'Noruega',
  mx: 'México',
  ec: 'Equador',
  'gb-eng': 'Inglaterra',
  cd: 'RD Congo',
  ar: 'Argentina',
  cv: 'Cabo Verde',
  au: 'Austrália',
  eg: 'Egito',
  ch: 'Suíça',
  dz: 'Argélia',
  gh: 'Gana',
  co: 'Colômbia'
};

const ES: Overrides = {
  py: 'Paraguay',
  de: 'Alemania',
  fr: 'Francia',
  se: 'Suecia',
  za: 'Sudáfrica',
  ca: 'Canadá',
  nl: 'Países Bajos',
  ma: 'Marruecos',
  pt: 'Portugal',
  hr: 'Croacia',
  es: 'España',
  at: 'Austria',
  us: 'Estados Unidos',
  ba: 'Bosnia y Herzegovina',
  sn: 'Senegal',
  be: 'Bélgica',
  br: 'Brasil',
  jp: 'Japón',
  ci: 'Costa de Marfil',
  no: 'Noruega',
  mx: 'México',
  ec: 'Ecuador',
  'gb-eng': 'Inglaterra',
  cd: 'RD Congo',
  ar: 'Argentina',
  cv: 'Cabo Verde',
  au: 'Australia',
  eg: 'Egipto',
  ch: 'Suiza',
  dz: 'Argelia',
  gh: 'Ghana',
  co: 'Colombia'
};

const TEAM_NAMES: Record<Exclude<Locale, 'en'>, Overrides> = {
  'pt-BR': PT_BR,
  es: ES
};

export function localizedTeamName(id: TeamId, locale: Locale): string {
  if (locale === 'en') return TEAMS[id].name;
  return TEAM_NAMES[locale][id] ?? TEAMS[id].name;
}
