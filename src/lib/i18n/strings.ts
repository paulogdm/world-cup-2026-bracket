// UI string dictionaries, one per supported locale. Keep the keys in sync with
// the `Strings` interface so a missing translation is a type error.

import type { Locale } from './locales';

export interface Strings {
  /** Accessible label for the language switcher. */
  langLabel: string;
  /** Small kicker above the wordmark. */
  eyebrow: string;
  /** First line of the wordmark; the styled "2026" is appended in markup. */
  wordmark: string;
  /** Suffix used in the document <title> after "<wordmark> 2026 — ". */
  bracketSuffix: string;
  /** Accessible label for the bracket <svg>. */
  bracketAria: string;
  share: string;
  shared: string;
  linkCopied: string;
  shareToX: string;
  realResults: string;
  realResultsTitle: string;
  clear: string;
  github: string;
  createPr: string;
  /** Accessible label for a flag button, e.g. "Pick Brazil". */
  pick: (name: string) => string;
  /** Share message when a champion has been crowned. */
  shareChampion: (name: string) => string;
  /** Share message before a champion is decided. */
  shareGeneric: string;
  // Schedule tooltip (venue, date, kickoff) shown when hovering a match.
  roundOf32: string;
  roundOf16: string;
  quarterFinal: string;
  semiFinal: string;
  final: string;
  /** Separator between the two teams, e.g. "vs". */
  versus: string;
  /** Tag marking the venue-local kickoff time. */
  kickoffLocal: string;
  /** Label before the viewer's own-timezone kickoff time. */
  yourTime: string;
  /** Accessible label for a match seat with no winner yet. */
  matchInfo: string;
  /** Accessible label for the Final's centre hover target. */
  finalMatchInfo: string;
  /** Host country names shown in the schedule tooltip. */
  countryUsa: string;
  countryCanada: string;
  countryMexico: string;
}

export const STRINGS: Record<Locale, Strings> = {
  en: {
    langLabel: 'Language',
    eyebrow: 'Knockout predictor — USA · Canada · Mexico',
    wordmark: 'World Cup',
    bracketSuffix: 'Interactive Bracket',
    bracketAria: 'World Cup 2026 bracket',
    share: 'Share',
    shared: 'Shared',
    linkCopied: 'Link copied',
    shareToX: 'Share to X',
    realResults: 'Real results',
    realResultsTitle: 'Load the real-world results from config.ts',
    clear: 'Clear',
    github: 'GitHub',
    createPr: 'Create a PR',
    pick: (name) => `Pick ${name}`,
    shareChampion: (name) => `Check my prediction: ${name} will be champion!`,
    shareGeneric: 'Check the interactive knockout stage here:',
    roundOf32: 'Round of 32',
    roundOf16: 'Round of 16',
    quarterFinal: 'Quarter-final',
    semiFinal: 'Semi-final',
    final: 'Final',
    versus: 'vs',
    kickoffLocal: 'local',
    yourTime: 'Your time',
    matchInfo: 'Match info',
    finalMatchInfo: 'Final match info',
    countryUsa: 'USA',
    countryCanada: 'Canada',
    countryMexico: 'Mexico'
  },
  'pt-BR': {
    langLabel: 'Idioma',
    eyebrow: 'Palpites do mata-mata — EUA · Canadá · México',
    wordmark: 'Copa do Mundo',
    bracketSuffix: 'Chaveamento interativo',
    bracketAria: 'Chaveamento da Copa do Mundo 2026',
    share: 'Compartilhar',
    shared: 'Compartilhado',
    linkCopied: 'Link copiado',
    shareToX: 'Compartilhar no X',
    realResults: 'Resultados reais',
    realResultsTitle: 'Carregar os resultados reais do config.ts',
    clear: 'Limpar',
    github: 'GitHub',
    createPr: 'Criar um PR',
    pick: (name) => `Escolher ${name}`,
    shareChampion: (name) => `Veja meu palpite: ${name} vai ser campeão!`,
    shareGeneric: 'Veja o mata-mata interativo aqui:',
    roundOf32: '16 avos de final',
    roundOf16: 'Oitavas de final',
    quarterFinal: 'Quartas de final',
    semiFinal: 'Semifinal',
    final: 'Final',
    versus: 'x',
    kickoffLocal: 'local',
    yourTime: 'Seu horário',
    matchInfo: 'Informações da partida',
    finalMatchInfo: 'Informações da final',
    countryUsa: 'EUA',
    countryCanada: 'Canadá',
    countryMexico: 'México'
  },
  es: {
    langLabel: 'Idioma',
    eyebrow: 'Pronóstico de eliminatorias — EE. UU. · Canadá · México',
    wordmark: 'Copa del Mundo',
    bracketSuffix: 'Cuadro interactivo',
    bracketAria: 'Cuadro de la Copa del Mundo 2026',
    share: 'Compartir',
    shared: 'Compartido',
    linkCopied: 'Enlace copiado',
    shareToX: 'Compartir en X',
    realResults: 'Resultados reales',
    realResultsTitle: 'Cargar los resultados reales desde config.ts',
    clear: 'Limpiar',
    github: 'GitHub',
    createPr: 'Crear un PR',
    pick: (name) => `Elegir ${name}`,
    shareChampion: (name) => `Mira mi pronóstico: ¡${name} será campeón!`,
    shareGeneric: 'Mira la fase eliminatoria interactiva aquí:',
    roundOf32: 'Dieciseisavos de final',
    roundOf16: 'Octavos de final',
    quarterFinal: 'Cuartos de final',
    semiFinal: 'Semifinal',
    final: 'Final',
    versus: 'vs',
    kickoffLocal: 'local',
    yourTime: 'Tu hora',
    matchInfo: 'Información del partido',
    finalMatchInfo: 'Información de la final',
    countryUsa: 'EE. UU.',
    countryCanada: 'Canadá',
    countryMexico: 'México'
  }
};
