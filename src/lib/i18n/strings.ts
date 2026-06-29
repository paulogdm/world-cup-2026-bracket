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
    shareGeneric: 'Check the interactive knockout stage here:'
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
    shareGeneric: 'Veja o mata-mata interativo aqui:'
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
    shareGeneric: 'Mira la fase eliminatoria interactiva aquí:'
  }
};
