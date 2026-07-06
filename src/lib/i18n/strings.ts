// UI string dictionaries, one per supported locale. Keep the keys in sync with
// the `Strings` interface so a missing translation is a type error.

import type { Locale } from './locales';

export interface Strings {
  /** Accessible label for the language switcher. */
  langLabel: string;
  /** Accessible label / tooltip prefix for the theme toggle. */
  themeLabel: string;
  /** Theme names, used in the toggle's accessible label. */
  themeSystem: string;
  themeLight: string;
  themeDark: string;
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
  /** Error-page kicker, combined with the HTTP status, e.g. "Error 404". */
  errorKicker: string;
  /** Headline shown for a 404 (page not found). */
  notFoundTitle: string;
  /** Body copy shown for a 404. */
  notFoundBody: string;
  /** Headline shown for any other (non-404) error. */
  errorTitle: string;
  /** Body copy shown for any other (non-404) error. */
  errorBody: string;
  /** Label for the link that returns to the bracket home. */
  backHome: string;
  /** Accessible label for a flag button, e.g. "Pick Brazil". */
  pick: (name: string) => string;
  /** Share message when a champion has been crowned. */
  shareChampion: (name: string) => string;
  /** Share message before a champion is decided. */
  shareGeneric: string;
  /** Nudge shown when every match but the final is filled — pick the champion. */
  pickChampionHint: string;
  // ── Share popup ──────────────────────────────────────────────────────────
  /** Heading of the share dialog. */
  shareTitle: string;
  /** Accessible label for the dialog's close button. */
  shareClose: string;
  /** Placeholder shown while the bracket image is being generated. */
  shareRendering: string;
  /** Body shown when image generation fails (link/X still work). */
  shareImageError: string;
  /** Alt text for the generated preview image. */
  sharePreviewAlt: string;
  /** Primary action: copy the rendered image to the clipboard. */
  copyImage: string;
  /** Action: download the rendered image as a PNG. */
  downloadPng: string;
  /** Action: copy the shareable link. */
  copyLink: string;
  /** Action: open the OS-native share sheet. */
  shareNative: string;
  /** Status: the image was copied to the clipboard. */
  imageCopied: string;
  /** Status: the image was downloaded. */
  imageDownloaded: string;
  /** Status: image couldn't be built but the link still works. */
  imageUnavailable: string;
  /** Export-card headline for the crowned champion, e.g. "Brazil wins!". */
  championWins: (name: string) => string;
  /** Export-card caption when no champion is decided yet. */
  bracketSoFar: string;
  // ── Final-score predictor ────────────────────────────────────────────────
  /** Label above the grand-final score stepper. */
  finalScoreLabel: string;
  /** Accessible label for a team's goal stepper, e.g. "Goals for Brazil". */
  goalsFor: (name: string) => string;
  /** Accessible label for the increment button. */
  addGoal: string;
  /** Accessible label for the decrement button. */
  removeGoal: string;
  /** Button that confirms the score and collapses the predictor. */
  finalScoreDone: string;
  /** Accessible label for the collapsed chip that reopens the predictor. */
  editFinalScore: string;
  /** Share message when a champion is crowned and a final score is predicted. */
  shareChampionScore: (name: string, score: string) => string;
  // ── Match detail card ──────────────────────────────────────────────────────
  /** A matchup line joining two team names, e.g. "England vs Mexico". */
  matchup: (a: string, b: string) => string;
  /** Accessible label for a clickable score pill, given the matchup line. */
  matchDetailPill: (matchup: string) => string;
  /** Accessible label for the detail card's close button. */
  matchDetailClose: string;
  /** Section label: the stadium and city where the match was played. */
  matchVenue: string;
  /** Section label: kick-off, shown in the visitor's own timezone. */
  matchKickoff: string;
  /** Note that the match was decided after extra time (prorrogação). */
  matchAfterExtraTime: string;
  /** Penalty-shootout result, e.g. "England won 4–3 on penalties". */
  matchPenalties: (winner: string, score: string) => string;
  /** Section label: the goals scored. */
  matchGoals: string;
  /** Suffix marking a penalty-kick goal, appended after a scorer. */
  matchGoalPenalty: string;
  /** Shown when a played match has no further detail recorded yet. */
  matchNoDetails: string;
}

export const STRINGS: Record<Locale, Strings> = {
  en: {
    langLabel: 'Language',
    themeLabel: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
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
    errorKicker: 'Error',
    notFoundTitle: 'Off the pitch',
    notFoundBody: "This page didn’t make it out of the group stage. Let’s get you back to the bracket.",
    errorTitle: 'Something went wrong',
    errorBody: 'An unexpected error stopped play. Try heading back to the bracket.',
    backHome: 'Back to the bracket',
    pick: (name) => `Pick ${name}`,
    shareChampion: (name) => `Check my prediction: ${name} will be champion!`,
    shareGeneric: 'Check the interactive knockout stage here:',
    pickChampionHint: 'Last step — pick your champion',
    shareTitle: 'Share your bracket',
    shareClose: 'Close share dialog',
    shareRendering: 'Rendering your bracket…',
    shareImageError: 'Couldn’t build the image. You can still copy the link or share to X.',
    sharePreviewAlt: 'Preview of your World Cup 2026 bracket',
    copyImage: 'Copy image',
    downloadPng: 'Download PNG',
    copyLink: 'Copy link',
    shareNative: 'Share…',
    imageCopied: 'Image copied',
    imageDownloaded: 'Image downloaded',
    imageUnavailable: 'Image unavailable — link still works',
    championWins: (name) => `${name} wins!`,
    bracketSoFar: 'My bracket so far',
    finalScoreLabel: 'Predict the final score',
    goalsFor: (name) => `Goals for ${name}`,
    addGoal: 'Add a goal',
    removeGoal: 'Remove a goal',
    finalScoreDone: 'OK',
    editFinalScore: 'Edit the final score',
    shareChampionScore: (name, score) => `Check my prediction: ${name} wins the final ${score} to be champion!`,
    matchup: (a, b) => `${a} vs ${b}`,
    matchDetailPill: (matchup) => `Match details: ${matchup}`,
    matchDetailClose: 'Close match details',
    matchVenue: 'Stadium',
    matchKickoff: 'Kick-off',
    matchAfterExtraTime: 'After extra time',
    matchPenalties: (winner, score) => `${winner} won ${score} on penalties`,
    matchGoals: 'Goals',
    matchGoalPenalty: '(pen.)',
    matchNoDetails: 'No further details recorded yet.'
  },
  'pt-BR': {
    langLabel: 'Idioma',
    themeLabel: 'Tema',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
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
    errorKicker: 'Erro',
    notFoundTitle: 'Fora de campo',
    notFoundBody: 'Esta página não passou da fase de grupos. Vamos te levar de volta ao chaveamento.',
    errorTitle: 'Algo deu errado',
    errorBody: 'Um erro inesperado interrompeu o jogo. Tente voltar ao chaveamento.',
    backHome: 'Voltar ao chaveamento',
    pick: (name) => `Escolher ${name}`,
    shareChampion: (name) => `Veja meu palpite: ${name} vai ser campeão!`,
    shareGeneric: 'Veja o mata-mata interativo aqui:',
    pickChampionHint: 'Última etapa — escolha seu campeão',
    shareTitle: 'Compartilhe seu chaveamento',
    shareClose: 'Fechar janela de compartilhamento',
    shareRendering: 'Gerando seu chaveamento…',
    shareImageError: 'Não foi possível gerar a imagem. Você ainda pode copiar o link ou compartilhar no X.',
    sharePreviewAlt: 'Prévia do seu chaveamento da Copa do Mundo 2026',
    copyImage: 'Copiar imagem',
    downloadPng: 'Baixar PNG',
    copyLink: 'Copiar link',
    shareNative: 'Compartilhar…',
    imageCopied: 'Imagem copiada',
    imageDownloaded: 'Imagem baixada',
    imageUnavailable: 'Imagem indisponível — o link funciona',
    championWins: (name) => `${name} vence!`,
    bracketSoFar: 'Meu chaveamento até agora',
    finalScoreLabel: 'Palpite o placar da final',
    goalsFor: (name) => `Gols de ${name}`,
    addGoal: 'Adicionar gol',
    removeGoal: 'Remover gol',
    finalScoreDone: 'OK',
    editFinalScore: 'Editar o placar da final',
    shareChampionScore: (name, score) => `Veja meu palpite: ${name} vence a final por ${score} e é campeão!`,
    matchup: (a, b) => `${a} x ${b}`,
    matchDetailPill: (matchup) => `Detalhes da partida: ${matchup}`,
    matchDetailClose: 'Fechar detalhes da partida',
    matchVenue: 'Estádio',
    matchKickoff: 'Início',
    matchAfterExtraTime: 'Após a prorrogação',
    matchPenalties: (winner, score) => `${winner} venceu por ${score} nos pênaltis`,
    matchGoals: 'Gols',
    matchGoalPenalty: '(pên.)',
    matchNoDetails: 'Nenhum detalhe adicional registrado ainda.'
  },
  es: {
    langLabel: 'Idioma',
    themeLabel: 'Tema',
    themeSystem: 'Sistema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
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
    errorKicker: 'Error',
    notFoundTitle: 'Fuera de juego',
    notFoundBody: 'Esta página no pasó de la fase de grupos. Te llevamos de vuelta al cuadro.',
    errorTitle: 'Algo salió mal',
    errorBody: 'Un error inesperado detuvo el juego. Intenta volver al cuadro.',
    backHome: 'Volver al cuadro',
    pick: (name) => `Elegir ${name}`,
    shareChampion: (name) => `Mira mi pronóstico: ¡${name} será campeón!`,
    shareGeneric: 'Mira la fase eliminatoria interactiva aquí:',
    pickChampionHint: 'Último paso — elige tu campeón',
    shareTitle: 'Comparte tu cuadro',
    shareClose: 'Cerrar ventana de compartir',
    shareRendering: 'Generando tu cuadro…',
    shareImageError: 'No se pudo crear la imagen. Aún puedes copiar el enlace o compartir en X.',
    sharePreviewAlt: 'Vista previa de tu cuadro de la Copa del Mundo 2026',
    copyImage: 'Copiar imagen',
    downloadPng: 'Descargar PNG',
    copyLink: 'Copiar enlace',
    shareNative: 'Compartir…',
    imageCopied: 'Imagen copiada',
    imageDownloaded: 'Imagen descargada',
    imageUnavailable: 'Imagen no disponible — el enlace funciona',
    championWins: (name) => `¡${name} gana!`,
    bracketSoFar: 'Mi cuadro hasta ahora',
    finalScoreLabel: 'Pronostica el marcador de la final',
    goalsFor: (name) => `Goles de ${name}`,
    addGoal: 'Añadir gol',
    removeGoal: 'Quitar gol',
    finalScoreDone: 'OK',
    editFinalScore: 'Editar el marcador de la final',
    shareChampionScore: (name, score) => `Mira mi pronóstico: ¡${name} gana la final ${score} y es campeón!`,
    matchup: (a, b) => `${a} vs ${b}`,
    matchDetailPill: (matchup) => `Detalles del partido: ${matchup}`,
    matchDetailClose: 'Cerrar detalles del partido',
    matchVenue: 'Estadio',
    matchKickoff: 'Inicio',
    matchAfterExtraTime: 'Tras la prórroga',
    matchPenalties: (winner, score) => `${winner} ganó ${score} en la tanda de penales`,
    matchGoals: 'Goles',
    matchGoalPenalty: '(pen.)',
    matchNoDetails: 'Aún no hay más detalles registrados.'
  }
};
