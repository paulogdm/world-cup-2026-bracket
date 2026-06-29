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
  /** Accessible busy label while the bracket hydrates. */
  loadingBracket: string;
  /** Accessible label for a flag button, e.g. "Pick Brazil". */
  pick: (name: string) => string;
  /** Share message when a champion has been crowned. */
  shareChampion: (name: string) => string;
  /** Share message before a champion is decided. */
  shareGeneric: string;

  // ── Share popup ──────────────────────────────────────────────────────────
  /** Heading of the share dialog. */
  shareTitle: string;
  /** Accessible label for the dialog's close button. */
  closeShare: string;
  /** Primary action: copy the generated image to the clipboard. */
  copyImage: string;
  /** Download the generated image as a PNG. */
  downloadPng: string;
  /** Copy the shareable link. */
  copyLink: string;
  /** Label for the native share action (the OS share sheet). */
  nativeShare: string;
  /** Placeholder shown while the share image is being rendered. */
  rendering: string;
  /** Shown when the share image fails to build. */
  imageBuildError: string;
  /** Alt text for the rendered share-image preview. */
  previewAlt: string;
  /** Status: image copied to the clipboard. */
  imageCopied: string;
  /** Status: image downloaded. */
  imageDownloaded: string;
  /** Status: image could not be built but the link still works. */
  imageUnavailable: string;

  // ── Export card ──────────────────────────────────────────────────────────
  /** Label above the champion flag on the export card. */
  predictedChampion: string;
  /** Neutral caption on the export card when no champion is decided. */
  bracketSoFar: string;
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
    loadingBracket: 'Loading bracket',
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
    loadingBracket: 'Carregando o chaveamento',
    pick: (name) => `Escolher ${name}`,
    shareChampion: (name) => `Veja meu palpite: ${name} vai ser campeão!`,
    shareGeneric: 'Veja o mata-mata interativo aqui:',
    shareTitle: 'Compartilhe seu chaveamento',
    closeShare: 'Fechar a janela de compartilhamento',
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
    loadingBracket: 'Cargando el cuadro',
    pick: (name) => `Elegir ${name}`,
    shareChampion: (name) => `Mira mi pronóstico: ¡${name} será campeón!`,
    shareGeneric: 'Mira la fase eliminatoria interactiva aquí:',
    shareTitle: 'Comparte tu cuadro',
    closeShare: 'Cerrar el diálogo de compartir',
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
    predictedChampion: 'Campeón pronosticado',
    bracketSoFar: 'Mi cuadro hasta ahora'
  }
};
