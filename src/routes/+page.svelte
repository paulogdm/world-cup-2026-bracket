<script lang="ts">
  import { onMount } from 'svelte';

  import BracketSvg from '$lib/bracket/BracketSvg.svelte';
  import { allNodes, matchById, VW, VH, type BracketNode } from '$lib/bracket/structure';
  import {
    champion,
    encode,
    decode,
    applyPick,
    picksFromResults,
    resolveTeam,
    type Picks
  } from '$lib/bracket/state';
  import { TEAMS, type TeamId } from '$lib/bracket/teams';
  import { defaultResults, TITLE } from '$lib/bracket/config';
  import { flagUrl } from '$lib/bracket/flags';

  type ShareStatus =
    | 'idle'
    | 'generating'
    | 'ready'
    | 'image-copied'
    | 'downloaded'
    | 'copied'
    | 'shared'
    | 'error';

  let picks = $state<Picks>({});
  let flashing = $state<Set<string>>(new Set());
  let ready = $state(false);
  let activePopoverNode = $state<string | null>(null);

  // Share popup state.
  let shareOpen = $state(false);
  let shareStatus = $state<ShareStatus>('idle');
  let imageUrl = $state<string | null>(null);
  let imageBlob = $state<Blob | null>(null);
  let shareUrl = $state('');
  let canNativeShare = $state(false);

  let pendingBlob: Promise<Blob> | null = null;
  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  let exportCard = $state<HTMLDivElement>();
  let dialogEl = $state<HTMLDivElement>();
  let closeBtn = $state<HTMLButtonElement>();
  let shareButton = $state<HTMLButtonElement>();

  const BRACKET_TOP_CROP = 48;
  const BRACKET_VIEW_HEIGHT = VH - BRACKET_TOP_CROP;
  const REPOSITORY_URL = 'https://github.com/paulogdm/world-cup-2026-bracket';

  // Initial state: shared bracket from the URL, else the real-world default.
  onMount(() => {
    const b = new URLSearchParams(location.search).get('b');
    picks = b ? decode(b) : picksFromResults(defaultResults);
    shareUrl = location.href;
    canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
    ready = true;
  });

  // Keep the URL in sync with every change (replaceState = no history spam).
  $effect(() => {
    if (!ready) return;
    const b = encode(picks);
    const url = new URL(location.href);
    if (b) url.searchParams.set('b', b);
    else url.searchParams.delete('b');
    history.replaceState(history.state, '', url);
    shareUrl = url.href;
  });

  const champ = $derived(champion(picks));
  const displayUrl = $derived(shareUrl.replace(/^https?:\/\//, ''));

  const statusLabel = $derived(
    shareStatus === 'image-copied'
      ? 'Image copied to clipboard'
      : shareStatus === 'downloaded'
        ? 'Image downloaded'
        : shareStatus === 'copied'
          ? 'Link copied'
          : shareStatus === 'shared'
            ? 'Shared'
            : shareStatus === 'error'
              ? 'Image unavailable — link still works'
              : ''
  );

  // Celebrate when a champion is crowned or changed — but not on the initial
  // load of a shared bracket, and not when the final is cleared.
  let lastChamp: TeamId | undefined;
  let confettiArmed = false;
  $effect(() => {
    const current = champ;
    if (!ready) return;
    if (!confettiArmed) {
      lastChamp = current;
      confettiArmed = true;
      return;
    }
    if (current && current !== lastChamp) celebrate(current);
    lastChamp = current;
  });

  async function celebrate(winner: TeamId) {
    const confetti = (await import('canvas-confetti')).default;
    const colors = [...TEAMS[winner].flagColors];
    const opts = { colors, disableForReducedMotion: true, zIndex: 9999 };
    confetti({ ...opts, particleCount: 130, spread: 90, startVelocity: 45, origin: { y: 0.4 } });
    confetti({ ...opts, particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.6 } });
    confetti({ ...opts, particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.6 } });
  }

  function teamOf(id: string): TeamId | undefined {
    return resolveTeam(id, picks);
  }

  function nodeButtonStyle(n: BracketNode): string {
    return [
      `--node-x: ${(n.x / VW) * 100}%`,
      `--node-y: ${((n.y - BRACKET_TOP_CROP) / BRACKET_VIEW_HEIGHT) * 100}%`,
      `--node-size: ${((n.r * 2) / VW) * 100}%`
    ].join('; ');
  }

  function pick(nodeId: string) {
    const result = applyPick(picks, nodeId);
    if (!result) return;
    picks = result.picks;

    // Flash the nodes whose result was just invalidated.
    if (result.cleared.length) {
      const outs = result.cleared
        .map((id) => matchById(id).outId)
        .filter((o): o is string => o !== null);
      flashing = new Set([...flashing, ...outs]);
      setTimeout(() => {
        flashing = new Set([...flashing].filter((o) => !outs.includes(o)));
      }, 700);
    }
  }

  function clearAll() {
    picks = {};
  }
  function loadReal() {
    picks = picksFromResults(defaultResults);
  }

  function shareText() {
    return champ
      ? `Check my prediction: ${TEAMS[champ].name} will be champion! ${shareUrl}`
      : `Check the interactive knockout stage here: ${shareUrl}`;
  }

  function fileName() {
    return `world-cup-2026-bracket${champ ? `-${champ}` : ''}.png`;
  }

  // ---- image generation ---------------------------------------------------
  // The bracket's flags/trophy are SVG <image> elements pointing at same-origin
  // URLs. html-to-image rasterises via an SVG-in-foreignObject that cannot load
  // external refs — leaving the *whole* capture blank — so we inline them as
  // data URIs first. Cached, since the same flags recur across renders.
  const dataUriCache = new Map<string, string>();

  async function toDataUri(url: string): Promise<string> {
    const cached = dataUriCache.get(url);
    if (cached) return cached;
    const blob = await (await fetch(url)).blob();
    const uri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    dataUriCache.set(url, uri);
    return uri;
  }

  async function inlineImages(root: HTMLElement) {
    await Promise.all(
      Array.from(root.querySelectorAll('image')).map(async (el) => {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('data:')) el.setAttribute('href', await toDataUri(href));
      })
    );
  }

  async function buildImage(): Promise<Blob> {
    if (!exportCard) throw new Error('export card not mounted');
    await document.fonts.ready;
    await inlineImages(exportCard);
    const { toBlob } = await import('html-to-image');
    const blob = await toBlob(exportCard, { pixelRatio: 2, cacheBust: true });
    if (!blob) throw new Error('rasterization failed');
    return blob;
  }

  function startPreview() {
    shareStatus = 'generating';
    revokePreview();
    imageBlob = null;
    pendingBlob = buildImage();
    pendingBlob
      .then((blob) => {
        imageBlob = blob;
        imageUrl = URL.createObjectURL(blob);
        shareStatus = 'ready';
      })
      .catch(() => {
        shareStatus = 'error';
      });
  }

  // Safari loses the user gesture if the blob is awaited before constructing the
  // ClipboardItem, so callers pass this Promise<Blob> straight in.
  function imageBlobPromise(): Promise<Blob> {
    if (imageBlob) return Promise.resolve(imageBlob);
    return pendingBlob ?? (pendingBlob = buildImage());
  }

  function revokePreview() {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      imageUrl = null;
    }
  }

  function flashStatus(s: ShareStatus) {
    shareStatus = s;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      if (shareOpen) shareStatus = imageUrl ? 'ready' : 'idle';
    }, 1800);
  }

  // ---- share actions ------------------------------------------------------
  function copyImage() {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
      void downloadPng();
      return;
    }
    try {
      const item = new ClipboardItem({ 'image/png': imageBlobPromise() });
      navigator.clipboard
        .write([item])
        .then(() => flashStatus('image-copied'))
        .catch(() => void downloadPng());
    } catch {
      void downloadPng();
    }
  }

  async function downloadPng() {
    try {
      const blob = await imageBlobPromise();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      flashStatus('downloaded');
    } catch {
      shareStatus = 'error';
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      flashStatus('copied');
    } catch {
      shareStatus = 'error';
    }
  }

  function shareToX() {
    const url = new URL('https://twitter.com/intent/tweet');
    url.searchParams.set('text', shareText());
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function nativeShare() {
    try {
      const blob = await imageBlobPromise();
      const file = new File([blob], fileName(), { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: TITLE, text: shareText(), files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: TITLE, text: shareText() });
      } else {
        await copyLink();
        return;
      }
      flashStatus('shared');
    } catch (e) {
      // A user-cancelled share is not an error; just settle back to ready.
      if ((e as Error)?.name !== 'AbortError') shareStatus = imageUrl ? 'ready' : 'error';
    }
  }

  // ---- modal plumbing -----------------------------------------------------
  function openShare() {
    shareOpen = true;
    startPreview();
  }

  function closeShare() {
    shareOpen = false;
    clearTimeout(statusTimer);
    revokePreview();
    imageBlob = null;
    pendingBlob = null;
    shareStatus = 'idle';
    shareButton?.focus();
  }

  // Focus the dialog when it opens.
  $effect(() => {
    if (shareOpen && dialogEl) (closeBtn ?? dialogEl).focus();
  });

  function focusables(): HTMLElement[] {
    if (!dialogEl) return [];
    return Array.from(
      dialogEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
  }

  function onDialogKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeShare();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) closeShare();
  }
</script>

<svelte:head>
  <title>{TITLE} — Interactive Bracket</title>
</svelte:head>

<main>
  <header class="masthead">
    <p class="eyebrow">Knockout predictor — USA · Canada · Mexico</p>
    <h1 class="wordmark">World Cup <span class="yr">2026</span></h1>

    <div class="actions">
      <button class="btn btn--go" onclick={openShare} bind:this={shareButton}>Share</button>
      <button class="btn" onclick={loadReal} title="Load the real-world results from config.ts">
        Real results
      </button>
      <button class="btn" onclick={clearAll}>Clear</button>
    </div>
  </header>

  {#if ready}
    <div class="board">
      <BracketSvg {picks} idPrefix="live-" {activePopoverNode} {flashing} />
      {#each allNodes as n (n.id)}
        {@const team = teamOf(n.id)}
        {#if team}
          <button
            class="node-button"
            style={nodeButtonStyle(n)}
            aria-label="Pick {TEAMS[team].name}"
            aria-pressed={n.parentMatch !== undefined && n.side !== undefined && picks[n.parentMatch] === n.side}
            onclick={() => pick(n.id)}
            onpointerenter={() => (activePopoverNode = n.id)}
            onpointerleave={() => activePopoverNode === n.id && (activePopoverNode = null)}
            onfocus={() => (activePopoverNode = n.id)}
            onblur={() => activePopoverNode === n.id && (activePopoverNode = null)}
          >
            <span class="sr-only">Pick {TEAMS[team].name}</span>
          </button>
        {/if}
      {/each}
    </div>
  {:else}
    <div class="board board--loading" aria-busy="true" aria-label="Loading bracket"></div>
  {/if}

  <footer class="site-footer">
    <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">GitHub</a>
    <span aria-hidden="true">/</span>
    <a href="{REPOSITORY_URL}/compare" target="_blank" rel="noreferrer">Create a PR</a>
  </footer>
</main>

<!-- Off-screen, branded export card that gets rasterised into the share image.
     The stage holds it off-screen; the card itself stays normally positioned so
     html-to-image renders it inside its foreignObject viewport. -->
{#if ready}
  <div class="export-stage" aria-hidden="true">
    <div class="export-card" bind:this={exportCard}>
      <div class="export-card__inner">
      <header class="export-card__head">
        <p class="export-card__eyebrow">Knockout predictor — USA · Canada · Mexico</p>
        <h2 class="export-card__title">World Cup <span>2026</span></h2>
      </header>
      <div class="export-card__bracket">
        <BracketSvg {picks} idPrefix="export-" interactive={false} />
      </div>
      <div class="export-card__footer">
        {#if champ}
          <div class="export-card__champ">
            <img class="export-card__champ-flag" src={flagUrl(champ)} alt="" />
            <div class="export-card__champ-text">
              <span class="export-card__champ-label">Predicted champion</span>
              <span class="export-card__champ-name">{TEAMS[champ].name}</span>
            </div>
          </div>
        {:else}
          <p class="export-card__neutral">My bracket so far</p>
        {/if}
        <p class="export-card__url">{displayUrl}</p>
      </div>
      </div>
    </div>
  </div>
{/if}

{#if shareOpen}
  <div class="share-overlay" role="presentation" onclick={onBackdropClick}>
    <div
      class="share-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      tabindex="-1"
      bind:this={dialogEl}
      onkeydown={onDialogKeydown}
    >
      <div class="share-modal__head">
        <h2 id="share-modal-title">Share your bracket</h2>
        <button
          class="share-close"
          onclick={closeShare}
          aria-label="Close share dialog"
          bind:this={closeBtn}
        >
          ×
        </button>
      </div>

      <div class="share-preview" aria-live="polite">
        {#if shareStatus === 'error'}
          <div class="share-preview__msg">
            Couldn’t build the image. You can still copy the link or share to X.
          </div>
        {:else if imageUrl}
          <img
            class="share-preview__img"
            src={imageUrl}
            alt="Preview of your World Cup 2026 bracket"
          />
        {:else}
          <div class="share-preview__msg share-preview__msg--loading">Rendering your bracket…</div>
        {/if}
      </div>

      <div class="share-actions">
        <button class="btn btn--go" onclick={copyImage} disabled={!imageBlob}>Copy image</button>
        <button class="btn" onclick={downloadPng} disabled={!imageBlob}>Download PNG</button>
        <button class="btn" onclick={copyLink}>Copy link</button>
        <button class="btn btn--x" onclick={shareToX} aria-label="Share to X">
          <img src="/x-logo.svg" alt="" aria-hidden="true" />
        </button>
        {#if canNativeShare}
          <button class="btn" onclick={nativeShare}>Share…</button>
        {/if}
      </div>

      <p class="share-status" aria-live="polite">{statusLabel || ' '}</p>
    </div>
  </div>
{/if}

<style>
  @font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 600;
    font-stretch: expanded;
    font-display: swap;
    src: url('/fonts/archivo-expanded-600.ttf') format('truetype');
  }

  @font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 800;
    font-stretch: expanded;
    font-display: swap;
    src: url('/fonts/archivo-expanded-800.ttf') format('truetype');
  }

  @font-face {
    font-family: 'Archivo';
    font-style: normal;
    font-weight: 900;
    font-stretch: expanded;
    font-display: swap;
    src: url('/fonts/archivo-expanded-900.ttf') format('truetype');
  }

  @font-face {
    font-family: 'Space Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('/fonts/space-mono-400.ttf') format('truetype');
  }

  @font-face {
    font-family: 'Space Mono';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('/fonts/space-mono-700.ttf') format('truetype');
  }

  :global(body) {
    margin: 0;
    /* Palette drawn from the poster + trophy: paper, ink, trophy gold, pitch green. */
    --paper: #f2efe4;
    --ink: #1a1916;
    --muted: #7c7565;
    --gold: #c8992f;
    --gold-fill: #e7c24a;
    --green: #1c7a3d;
    --line: rgba(26, 25, 22, 0.14);
    --mono: 'Space Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
    --display: 'Archivo', ui-sans-serif, system-ui, sans-serif;
    background: var(--paper);
    color: var(--ink);
    font-family:
      ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  main {
    max-width: 920px;
    margin: 0 auto;
    padding: 1.25rem 1rem 2.5rem;
  }

  .masthead {
    text-align: center;
    padding-bottom: 0.25rem;
  }
  .masthead > * {
    animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
  }
  .masthead > *:nth-child(2) {
    animation-delay: 0.05s;
  }
  .masthead > *:nth-child(3) {
    animation-delay: 0.1s;
  }
  .masthead > *:nth-child(4) {
    animation-delay: 0.15s;
  }
  .masthead > *:nth-child(5) {
    animation-delay: 0.2s;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  .eyebrow {
    margin: 0 0 0.7rem;
    font-family: var(--mono);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .wordmark {
    margin: 0;
    font-family: var(--display);
    font-weight: 900;
    font-stretch: 125%;
    text-transform: uppercase;
    font-size: clamp(2.1rem, 8vw, 3.9rem);
    line-height: 0.9;
    letter-spacing: 0.005em;
    color: var(--ink);
  }
  .wordmark .yr {
    color: var(--gold);
    -webkit-text-stroke: 0;
  }
  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: clamp(1.1rem, 2.4vw, 1.7rem);
  }
  .btn {
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    padding: 0.55rem 0.95rem;
    border-radius: 999px;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      transform 0.05s ease;
  }
  .btn:hover {
    background: rgba(26, 25, 22, 0.05);
    border-color: rgba(26, 25, 22, 0.28);
  }
  .btn:active {
    transform: translateY(1px);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .btn:disabled:hover {
    background: transparent;
    border-color: var(--line);
  }
  .btn--go {
    background: var(--gold-fill);
    border-color: var(--gold);
    color: var(--ink);
  }
  .btn--go:hover {
    background: var(--gold);
    border-color: var(--gold);
  }
  .btn--go:disabled:hover {
    background: var(--gold-fill);
    border-color: var(--gold);
  }
  .btn--x {
    min-width: 2.7rem;
    padding-inline: 0.8rem;
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
    font-family: var(--display);
    font-size: 0.82rem;
    font-weight: 900;
    letter-spacing: 0;
  }
  .btn--x img {
    display: block;
    width: 0.95rem;
    height: 0.95rem;
    filter: invert(1);
    margin: 0 auto;
  }
  .btn--x:hover {
    background: #000;
    border-color: #000;
  }
  .btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .masthead > * {
      animation: none;
    }
  }

  .board {
    position: relative;
    width: 100%;
  }
  .board--loading {
    aspect-ratio: 880 / 932;
  }

  .node-button {
    position: absolute;
    z-index: 2;
    top: var(--node-y);
    left: var(--node-x);
    width: max(var(--node-size), 2.25rem);
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    transform: translate(-50%, -50%);
  }
  .node-button:focus-visible {
    outline: 3px solid var(--gold);
    outline-offset: 3px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .site-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    margin-top: 1.1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--line);
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .site-footer a {
    color: inherit;
    text-decoration: none;
    transition: color 0.15s ease;
  }
  .site-footer a:hover {
    color: var(--ink);
  }
  .site-footer a:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 3px;
  }

  /* ---- share popup ------------------------------------------------------ */
  .share-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(26, 25, 22, 0.55);
    backdrop-filter: blur(2px);
    animation: overlay-in 0.15s ease;
  }
  @keyframes overlay-in {
    from {
      opacity: 0;
    }
  }
  .share-modal {
    box-sizing: border-box;
    width: min(92vw, 420px);
    max-height: 92vh;
    overflow-x: hidden;
    overflow-y: auto;
    padding: 1.1rem 1.1rem 1.25rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(26, 25, 22, 0.35);
    animation: modal-in 0.18s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .share-modal:focus {
    outline: none;
  }
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
  }
  .share-modal__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.85rem;
  }
  .share-modal__head h2 {
    margin: 0;
    font-family: var(--display);
    font-weight: 800;
    font-stretch: expanded;
    text-transform: uppercase;
    font-size: 1rem;
    letter-spacing: 0.02em;
  }
  .share-close {
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--muted);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
  }
  .share-close:hover {
    background: rgba(26, 25, 22, 0.06);
    color: var(--ink);
  }
  .share-close:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .share-preview {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    width: 100%;
    overflow: hidden;
    background: #e9e5d8;
    border: 1px solid var(--line);
    border-radius: 12px;
  }
  .share-preview__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .share-preview__msg {
    padding: 1rem;
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--muted);
    text-align: center;
  }
  .share-preview__msg--loading {
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.4;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .share-overlay,
    .share-modal {
      animation: none;
    }
    .share-preview__msg--loading {
      animation: none;
    }
  }
  .share-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.9rem;
  }
  .share-actions .btn {
    flex: 1 1 auto;
  }
  .share-actions .btn--x {
    flex: 0 0 auto;
  }
  .share-status {
    min-height: 1.1rem;
    margin: 0.7rem 0 0;
    text-align: center;
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--green);
  }

  /* ---- off-screen export card ------------------------------------------- */
  .export-stage {
    position: fixed;
    left: -99999px;
    top: 0;
    pointer-events: none;
  }
  .export-card {
    position: relative;
    width: 1080px;
    height: 1080px;
    background: var(--paper);
    color: var(--ink);
  }
  .export-card__inner {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 56px 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .export-card__head {
    text-align: center;
  }
  .export-card__eyebrow {
    margin: 0 0 8px;
    font-family: var(--mono);
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .export-card__title {
    margin: 0;
    font-family: var(--display);
    font-weight: 900;
    font-stretch: 125%;
    text-transform: uppercase;
    font-size: 68px;
    line-height: 0.9;
    letter-spacing: 0.005em;
  }
  .export-card__title span {
    color: var(--gold);
  }
  .export-card__bracket {
    width: 720px;
    margin-top: 8px;
  }
  .export-card__footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .export-card__champ {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .export-card__champ-flag {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--gold);
  }
  .export-card__champ-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
  }
  .export-card__champ-label {
    font-family: var(--mono);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .export-card__champ-name {
    font-family: var(--display);
    font-weight: 800;
    font-stretch: expanded;
    text-transform: uppercase;
    font-size: 42px;
    line-height: 1;
  }
  .export-card__neutral {
    margin: 0;
    font-family: var(--display);
    font-weight: 800;
    font-stretch: expanded;
    text-transform: uppercase;
    font-size: 34px;
    color: var(--muted);
  }
  .export-card__url {
    margin: 0;
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--ink);
  }
</style>
