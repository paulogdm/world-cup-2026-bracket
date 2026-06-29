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
  /** Share popup — modal heading. */
  shareTitle: string;
  /** Share popup — accessible label for the close button. */
  closeShare: string;
  /** Share popup — copy the generated image to the clipboard. */
  copyImage: string;
  /** Share popup — download the generated image as a PNG. */
  downloadPng: string;
  /** Share popup — copy the bracket link. */
  copyLink: string;
  /** Share popup — native share action label. */
  nativeShare: string;
  /** Share popup — placeholder while the image renders. */
  rendering: string;
  /** Share popup — shown when image generation fails. */
  imageBuildError: string;
  /** Share popup — alt text for the rendered preview image. */
  previewAlt: string;
  /** Share popup — status after copying the image to the clipboard. */
  imageCopied: string;
  /** Share popup — status after downloading the image. */
  imageDownloaded: string;
  /** Share popup — status when the image failed but the link still works. */
  imageUnavailable: string;
  /** Export card — label above the champion call-out. */
  predictedChampion: string;
  /** Export card — caption shown before a champion is decided. */
  bracketSoFar: string;
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
    shareTitle: 'Share your bracket',
    closeShare: 'Close share dialog',
    copyImage: 'Copy image',
    downloadPng: 'Download PNG',
    copyLink: 'Copy link',
    nativeShare: 'Share…',
    rendering: 'Rendering your bracket…',
    imageBuildError: 'Couldn’t build the image. You can still copy the link or share to X.',
    previewAlt: 'Preview of your World Cup 2026 bracket',
    imageCopied: 'Image copied to clipboard',
    imageDownloaded: 'Image downloaded',
    imageUnavailable: 'Image unavailable — link still works',
    predictedChampion: 'Predicted champion',
    bracketSoFar: 'My bracket so far'
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
    shareTitle: 'Compartilhe seu chaveamento',
    closeShare: 'Fechar janela de compartilhamento',
    copyImage: 'Copiar imagem',
    downloadPng: 'Baixar PNG',
    copyLink: 'Copiar link',
    nativeShare: 'Compartilhar…',
    rendering: 'Gerando seu chaveamento…',
    imageBuildError: 'Não foi possível gerar a imagem. Você ainda pode copiar o link ou compartilhar no X.',
    previewAlt: 'Prévia do seu chaveamento da Copa do Mundo 2026',
    imageCopied: 'Imagem copiada para a área de transferência',
    imageDownloaded: 'Imagem baixada',
    imageUnavailable: 'Imagem indisponível — o link ainda funciona',
    predictedChampion: 'Campeão previsto',
    bracketSoFar: 'Meu chaveamento até agora'
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
    shareTitle: 'Comparte tu cuadro',
    closeShare: 'Cerrar la ventana de compartir',
    copyImage: 'Copiar imagen',
    downloadPng: 'Descargar PNG',
    copyLink: 'Copiar enlace',
    nativeShare: 'Compartir…',
    rendering: 'Generando tu cuadro…',
    imageBuildError: 'No se pudo generar la imagen. Aún puedes copiar el enlace o compartir en X.',
    previewAlt: 'Vista previa de tu cuadro de la Copa del Mundo 2026',
    imageCopied: 'Imagen copiada al portapapeles',
    imageDownloaded: 'Imagen descargada',
    imageUnavailable: 'Imagen no disponible — el enlace sigue funcionando',
    predictedChampion: 'Campeón previsto',
    bracketSoFar: 'Mi cuadro hasta ahora'
  }
};
