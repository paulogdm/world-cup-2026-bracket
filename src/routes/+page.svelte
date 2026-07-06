<script lang="ts">
  import { onMount } from 'svelte';
  import { pushState } from '$app/navigation';
  import { page } from '$app/state';

  import BracketSvg from '$lib/bracket/BracketSvg.svelte';
  import { allNodes, matchById, finalChildren, VW, VH, type BracketNode } from '$lib/bracket/structure';
  import { scoreLabelsFor, finalScoreFor, type ScoreLabel } from '$lib/bracket/scores';
  import { matchDetailFor } from '$lib/bracket/match-details';
  import {
    champion,
    championNode,
    encode,
    decode,
    decodeFinalScore,
    clampFinalScore,
    GOAL_MAX,
    applyPick,
    picksFromResults,
    resolveTeam,
    type Picks,
    type FinalScore
  } from '$lib/bracket/state';
  import { TEAMS, type TeamId } from '$lib/bracket/teams';
  import { defaultResults } from '$lib/bracket/config';
  import { flagUrl } from '$lib/bracket/flags';
  import { LOCALES, LOCALE_META, type Locale } from '$lib/i18n/locales';
  import { STRINGS } from '$lib/i18n/strings';
  import { localizedTeamName } from '$lib/i18n/team-names';
  import { i18n, initLocale } from '$lib/i18n/store.svelte';
  import { type Theme } from '$lib/theme/themes';
  import { theme, initTheme } from '$lib/theme/store.svelte';

  // Current UI strings, reactive to the selected locale.
  const t = $derived(STRINGS[i18n.locale]);
  const teamName = (id: TeamId) => localizedTeamName(id, i18n.locale);

  // Localized name for each theme, used in the toggle's accessible label.
  const themeName = $derived<Record<Theme, string>>({
    system: t.themeSystem,
    light: t.themeLight,
    dark: t.themeDark
  });
  // The toggle flips between the two concrete appearances based on what's
  // currently on screen. `system` stays the initial default (so first paint can
  // follow the OS), but the toggle never returns to it — otherwise one click in
  // three would be a visual no-op whenever `system` happens to match the OS.
  function toggleTheme() {
    theme.value = resolvedTheme === 'dark' ? 'light' : 'dark';
  }

  // The real-world default state. Computed once so it can seed the prerendered
  // markup *and* be compared against on every URL sync (see below).
  const DEFAULT_PICKS = picksFromResults(defaultResults);
  const DEFAULT_ENCODED = encode(DEFAULT_PICKS);

  let flashing = $state<Set<string>>(new Set());
  let ready = $state(false);
  let activePopoverNode = $state<string | null>(null);
  // Whether the grand-final score predictor is expanded (steppers) or collapsed
  // to a compact score chip. UI-only — not part of the shared bracket.
  let scoreEditorOpen = $state(true);
  // Tracks the OS preference so a `system` theme resolves to a concrete
  // light/dark for the rasterised export (which can't read `light-dark()`).
  let systemDark = $state(false);
  const resolvedTheme = $derived<'light' | 'dark'>(
    theme.value === 'system' ? (systemDark ? 'dark' : 'light') : theme.value
  );

  // The bracket state lives in history, so the browser's Back/Forward buttons
  // can replay it. Each edit pushes an entry whose encoded picks ride in
  // `page.state.b`; shallow routing sets that on every edit and restores it on
  // Back/Forward, and this derived decodes it — so history is the source of
  // truth. `page.state` is used (not the `?b` query) because an empty bracket
  // and the default both collapse to a bare URL, yet must stay distinct states.
  // The initial entry has no `page.state` (a fresh load can't restore it), so
  // there we fall back to the URL — which does disambiguate on first load
  // (bare = default, `?b=...` = a shared bracket). Before hydration we render
  // the default, matching the prerendered markup (no empty-skeleton flash).
  const picks = $derived.by<Picks>(() => {
    if (!ready) return DEFAULT_PICKS;
    const b = page.state.b;
    return b === undefined ? decodeUrl(page.url) : decode(b);
  });

  // The explicitly-predicted final score packed in the URL, if the sharer set
  // one. Read from the same source as `picks` so it rides the same history
  // entry. `finalScore` (the display value, defaulting to 1–0 for a crowned
  // champion) is derived further down, once `champ` is known.
  const rawFinalScore = $derived.by<FinalScore | undefined>(() => {
    if (!ready) return undefined;
    const b = page.state.b;
    const s = b === undefined ? (page.url.searchParams.get('b') ?? '') : b;
    return decodeFinalScore(s);
  });

  type ShareStatus =
    | 'idle'
    | 'generating'
    | 'ready'
    | 'image-copied'
    | 'downloaded'
    | 'copied'
    | 'shared'
    | 'error';

  // Share popup state.
  let shareOpen = $state(false);
  let shareStatus = $state<ShareStatus>('idle');
  let imageUrl = $state<string | null>(null);
  let imageBlob = $state<Blob | null>(null);
  // Derive the share URL from the current picks, NOT from `page.url`. Shallow
  // routing (`pushState`) only updates the address bar and `page.state`; it never
  // reassigns `page.url`, so after any edit `page.url.href` is frozen at the URL
  // the page loaded with — reading it here drops (or staled) the `?b=...` we just
  // pushed, leaving the share image and copied link pointing at the wrong bracket.
  // `bracketUrl` rebuilds from the live `location.href`, so it always matches.
  const shareUrl = $derived(ready ? bracketUrl(picks, rawFinalScore).href : '');
  let canNativeShare = $state(false);

  let pendingBlob: Promise<Blob> | null = null;
  let statusTimer: ReturnType<typeof setTimeout> | undefined;
  let exportCard = $state<HTMLDivElement>();
  let dialogEl = $state<HTMLDivElement>();
  let closeBtn = $state<HTMLButtonElement>();
  let shareButton = $state<HTMLButtonElement>();

  // Match detail card state. A score pill opens it; `detailMatchId` names the
  // played match whose story to show. Only matchups with a pill can open it.
  let detailMatchId = $state<string | null>(null);
  let detailEl = $state<HTMLDivElement>();
  let detailCloseBtn = $state<HTMLButtonElement>();
  // Where to send focus when the card closes — the pill that opened it.
  let detailReturnFocus: HTMLElement | null = null;

  const REPOSITORY_URL = 'https://github.com/paulogdm/world-cup-2026-bracket';
  const BRACKET_TOP_CROP = 48;
  const BRACKET_VIEW_HEIGHT = VH - BRACKET_TOP_CROP;

  // Flags for the language switcher (kept separate from the team flags so the
  // switcher doesn't depend on those codes happening to be teams).
  const localeFlagModules = import.meta.glob<string>(
    '/node_modules/flag-icons/flags/1x1/{us,br,es}.svg',
    { eager: true, import: 'default', query: '?url' }
  );
  const localeFlagUrls = Object.fromEntries(
    Object.entries(localeFlagModules).map(([path, url]) => [path.match(/\/([^/]+)\.svg$/)![1], url])
  ) as Record<string, string>;
  const localeFlag = (loc: Locale) => localeFlagUrls[LOCALE_META[loc].flag];

  // Resolve the UI language (stored choice → browser preference → English) and
  // override the default with a shared bracket only when the URL carries one.
  onMount(() => {
    initLocale();
    initTheme();
    canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
    ready = true;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    systemDark = mq.matches;
    const onSchemeChange = (e: MediaQueryListEvent) => (systemDark = e.matches);
    mq.addEventListener('change', onSchemeChange);
    return () => mq.removeEventListener('change', onSchemeChange);
  });

  // Keep the document language in sync with the selected locale.
  $effect(() => {
    document.documentElement.lang = LOCALE_META[i18n.locale].htmlLang;
  });

  // The picks a shared/bookmarked URL represents (default when bare).
  function decodeUrl(url: URL): Picks {
    const b = url.searchParams.get('b');
    return b ? decode(b) : DEFAULT_PICKS;
  }

  // Build the canonical share URL for a set of picks (+ optional predicted final
  // score). The default state stays a bare URL — never pin a snapshot of it into
  // `?b`, so the canonical/shared link keeps tracking the redeployed defaults.
  // Any other query params kept.
  function bracketUrl(next: Picks, score?: FinalScore): URL {
    const b = encode(next, score);
    const url = new URL(location.href);
    if (b && b !== DEFAULT_ENCODED) url.searchParams.set('b', b);
    else url.searchParams.delete('b');
    return url;
  }

  // Every edit becomes a history entry, so the browser Back/Forward buttons
  // step through the picks one at a time. Shallow routing updates the URL for
  // sharing and stores the exact encoding in `page.state`; since `picks` is
  // derived from `page.state`, this push is the sole write path — Back/Forward
  // just move through the entries and the bracket follows.
  function commitState(next: Picks, score: FinalScore | undefined) {
    const b = encode(next, score);
    if (b === encode(picks, rawFinalScore)) return; // no-op edit — no dupe entry
    pushState(bracketUrl(next, score), { b });
  }

  const champ = $derived(champion(picks));

  // The scoreline a freshly crowned champion shows until the user adjusts it,
  // without pinning anything into the URL until they actually touch it.
  const DEFAULT_FINAL_SCORE: FinalScore = { champ: 1, loser: 0 };

  // What the editor shows: a crowned champion always presents a scoreline,
  // defaulting to 1–0 until the user adjusts it (so a bare crown stays a bare
  // URL). No champion → nothing to predict.
  const finalScore = $derived<FinalScore | undefined>(
    champ ? (rawFinalScore ?? DEFAULT_FINAL_SCORE) : undefined
  );

  // The two finalists in bracket order (left half, right half) so the editor
  // mirrors the board instead of always putting the winner first. The score is
  // stored champion-relative, so we map it onto sides for display.
  const leftFinalist = $derived<TeamId | undefined>(resolveTeam(finalChildren[0], picks));
  const rightFinalist = $derived<TeamId | undefined>(resolveTeam(finalChildren[1], picks));
  const championIsLeft = $derived(championNode(picks) === finalChildren[0]);
  const leftGoals = $derived(
    finalScore ? (championIsLeft ? finalScore.champ : finalScore.loser) : 0
  );
  const rightGoals = $derived(
    finalScore ? (championIsLeft ? finalScore.loser : finalScore.champ) : 0
  );

  function setFinalScore(next: FinalScore) {
    commitState(picks, clampFinalScore(next));
  }
  // Set from on-screen side goals; whichever side is the champion stays higher.
  function setSideGoals(left: number, right: number) {
    setFinalScore(championIsLeft ? { champ: left, loser: right } : { champ: right, loser: left });
  }
  function bumpLeft(delta: number) {
    setSideGoals(leftGoals + delta, rightGoals);
  }
  function bumpRight(delta: number) {
    setSideGoals(leftGoals, rightGoals + delta);
  }
  // Both finalists are set but the centre is still empty — everything else has
  // been filled, so nudge the user to crown the champion (the easy step to miss).
  const needsChampion = $derived(
    ready &&
      !champ &&
      resolveTeam(finalChildren[0], picks) !== undefined &&
      resolveTeam(finalChildren[1], picks) !== undefined
  );
  const displayUrl = $derived(shareUrl.replace(/^https?:\/\//, ''));

  const statusLabel = $derived(
    shareStatus === 'image-copied'
      ? t.imageCopied
      : shareStatus === 'downloaded'
        ? t.imageDownloaded
        : shareStatus === 'copied'
          ? t.linkCopied
          : shareStatus === 'shared'
            ? t.shared
            : shareStatus === 'error'
              ? t.imageUnavailable
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

  // Positioned score pills for the currently-shown bracket — the same labels the
  // SVG draws, mirrored here so we can lay clickable buttons over them.
  const scoreLabels = $derived<ScoreLabel[]>(scoreLabelsFor(picks));

  // A transparent button sits over each pill; place and size it in board
  // percentages, the same transform the flag node-buttons use.
  function pillButtonStyle(s: ScoreLabel): string {
    const halfW = s.text.length * 3.1 + 5; // mirrors the SVG pill's half-width
    return [
      `--pill-x: ${(s.x / VW) * 100}%`,
      `--pill-y: ${((s.y - BRACKET_TOP_CROP) / BRACKET_VIEW_HEIGHT) * 100}%`,
      `--pill-w: ${((halfW * 2) / VW) * 100}%`,
      `--pill-h: ${(17 / BRACKET_VIEW_HEIGHT) * 100}%`
    ].join('; ');
  }

  // The two real teams of a played match, winner first. Resolved against the
  // canonical results so it's stable regardless of what the visitor has re-picked
  // (a pill only shows while the real matchup stands, so both are always defined).
  function matchTeams(matchId: string): { winner: TeamId; loser: TeamId } | null {
    const winner = defaultResults[matchId];
    if (!winner) return null;
    const m = matchById(matchId);
    const a = resolveTeam(m.a, DEFAULT_PICKS);
    const b = resolveTeam(m.b, DEFAULT_PICKS);
    const loser = a === winner ? b : a;
    if (!loser) return null;
    return { winner, loser };
  }

  // Format a kick-off instant in the visitor's own timezone and current UI
  // locale. Only ever called from the (client-only) card, so there's no SSR
  // hydration mismatch to worry about. `timeZone` is left to the browser default.
  function formatKickoff(iso: string, locale: Locale): string {
    try {
      return new Intl.DateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  // The full model behind the open detail card, or null when none is open.
  // Everything optional stays absent when unrecorded, so the card renders only
  // the sections it actually has data for.
  const detailCard = $derived.by(() => {
    if (!detailMatchId) return null;
    const teams = matchTeams(detailMatchId);
    if (!teams) return null;
    const score = finalScoreFor(detailMatchId);
    const detail = matchDetailFor(detailMatchId);

    const goals = detail?.goals?.map((g) => {
      const team = g.team === 'winner' ? teams.winner : teams.loser;
      return { team, scorer: g.scorer, minute: g.minute, penalty: g.penalty };
    });

    return {
      matchId: detailMatchId,
      winner: teams.winner,
      loser: teams.loser,
      winnerName: teamName(teams.winner),
      loserName: teamName(teams.loser),
      score,
      venue: detail?.venue,
      kickoff: detail?.kickoff,
      extraTime: detail?.extraTime ?? false,
      penalties: detail?.penalties,
      goals
    };
  });

  // Whether the open card has anything beyond the header (teams + score) to show.
  const detailHasBody = $derived(
    !!detailCard &&
      (!!detailCard.venue ||
        !!detailCard.kickoff ||
        detailCard.extraTime ||
        !!detailCard.penalties ||
        (detailCard.goals?.length ?? 0) > 0)
  );

  function openDetail(matchId: string, event: MouseEvent | KeyboardEvent) {
    detailReturnFocus = (event.currentTarget as HTMLElement) ?? null;
    detailMatchId = matchId;
  }

  function closeDetail() {
    detailMatchId = null;
    detailReturnFocus?.focus();
    detailReturnFocus = null;
  }

  // Focus the card when it opens.
  $effect(() => {
    if (detailMatchId && detailEl) (detailCloseBtn ?? detailEl).focus();
  });

  function detailFocusables(): HTMLElement[] {
    if (!detailEl) return [];
    return Array.from(
      detailEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
  }

  function onDetailKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDetail();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = detailFocusables();
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

  function onDetailBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) closeDetail();
  }

  function pick(nodeId: string) {
    const result = applyPick(picks, nodeId);
    if (!result) return;
    // Keep an explicitly-set final score only while a champion still stands;
    // clearing/changing the final drops the prediction with it.
    const keepScore = champion(result.picks) ? rawFinalScore : undefined;
    commitState(result.picks, keepScore);

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
    commitState({}, undefined);
  }
  function loadReal() {
    commitState(picksFromResults(defaultResults), undefined);
  }

  function shareText() {
    let message = t.shareGeneric;
    if (champ) {
      const name = teamName(champ);
      message = finalScore
        ? t.shareChampionScore(name, `${finalScore.champ}–${finalScore.loser}`)
        : t.shareChampion(name);
    }
    return `${message} ${shareUrl}`;
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
    const title = `${t.wordmark} 2026`;
    try {
      const blob = await imageBlobPromise();
      const file = new File([blob], fileName(), { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: shareText(), files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title, text: shareText() });
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
  <title>{t.wordmark} 2026 — {t.bracketSuffix}</title>
</svelte:head>

<main>
  <div class="topbar">
    <button
      type="button"
      class="theme-toggle"
      onclick={toggleTheme}
      title="{t.themeLabel}: {themeName[resolvedTheme]}"
      aria-label="{t.themeLabel}: {themeName[resolvedTheme]}"
    >
      {#if resolvedTheme === 'dark'}
        <!-- moon -->
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a0.6 0.6 0 0 0-0.8-0.8 9.2 9.2 0 1 0 12.1 12.1 0.6 0.6 0 0 0-0.8-0.8z" />
        </svg>
      {:else}
        <!-- sun -->
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4.2" />
          <path
            d="M12 2.6v2.5M12 18.9v2.5M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2.6 12h2.5M18.9 12h2.5M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
          />
        </svg>
      {/if}
    </button>

    <nav class="lang-switch" aria-label={t.langLabel}>
      {#each LOCALES as loc}
      <button
        type="button"
        class="lang-btn"
        class:active={i18n.locale === loc}
        lang={LOCALE_META[loc].htmlLang}
        aria-pressed={i18n.locale === loc}
        aria-label={LOCALE_META[loc].label}
        title={LOCALE_META[loc].label}
        onclick={() => (i18n.locale = loc)}
      >
        <img src={localeFlag(loc)} alt="" aria-hidden="true" />
        <span>{LOCALE_META[loc].short}</span>
      </button>
      {/each}
    </nav>
  </div>

  <header class="masthead">
    <p class="eyebrow">{t.eyebrow}</p>
    <h1 class="wordmark">{t.wordmark} <span class="yr">2026</span></h1>

    <div class="actions">
      <button class="btn btn--go" onclick={openShare} bind:this={shareButton}>{t.share}</button>
      <button class="btn" onclick={loadReal} title={t.realResultsTitle}>
        {t.realResults}
      </button>
      <button class="btn" onclick={clearAll}>{t.clear}</button>
    </div>
  </header>

  <div class="board">
    <BracketSvg {picks} {teamName} ariaLabel={t.bracketAria} idPrefix="live-" theme={resolvedTheme} {activePopoverNode} {flashing} />
    {#each allNodes as n (n.id)}
      {@const team = teamOf(n.id)}
      {#if team}
        <button
          class="node-button"
          style={nodeButtonStyle(n)}
          aria-label={t.pick(teamName(team))}
          aria-pressed={n.parentMatch !== undefined && n.side !== undefined && picks[n.parentMatch] === n.side}
          onclick={() => pick(n.id)}
          onpointerenter={() => (activePopoverNode = n.id)}
          onpointerleave={() => activePopoverNode === n.id && (activePopoverNode = null)}
          onfocus={() => (activePopoverNode = n.id)}
          onblur={() => activePopoverNode === n.id && (activePopoverNode = null)}
        >
          <span class="sr-only">{t.pick(teamName(team))}</span>
        </button>
      {/if}
    {/each}

    <!-- A transparent, focusable button over each real score pill. Clicking (or
         Enter/Space on) it opens the match detail card. Unplayed matchups have
         no pill, so there's nothing to open. -->
    {#each scoreLabels as s (s.matchId)}
      {@const teams = matchTeams(s.matchId)}
      {#if teams}
        <button
          type="button"
          class="pill-button"
          style={pillButtonStyle(s)}
          aria-haspopup="dialog"
          aria-label={t.matchDetailPill(t.matchup(teamName(teams.winner), teamName(teams.loser)))}
          onclick={(e) => openDetail(s.matchId, e)}
        ></button>
      {/if}
    {/each}

    {#if needsChampion}
      <div class="champ-hint" role="status">
        <span class="champ-hint__pill">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M12 5v14M12 5l-5 5M12 5l5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {t.pickChampionHint}
        </span>
      </div>
    {/if}

    <!-- Predict the grand-final scoreline. Only shown once a champion is
         crowned. The two finalists keep their bracket sides (left half / right
         half); whichever side holds the champion is constrained to the higher
         number (a final must have a winner, and the pick already chose it). -->
    {#if champ && finalScore && leftFinalist && rightFinalist}
      {@const left = leftFinalist}
      {@const right = rightFinalist}
      {#if scoreEditorOpen}
        <div class="score-predict" role="group" aria-label={t.finalScoreLabel}>
          <span class="score-predict__label">{t.finalScoreLabel}</span>
          <div class="score-predict__row">
            <div class="score-predict__side">
              <img class="score-predict__flag" src={flagUrl(left)} alt="" />
              <div class="stepper" role="group" aria-label={t.goalsFor(teamName(left))}>
                <button
                  class="stepper__btn"
                  onclick={() => bumpLeft(-1)}
                  disabled={championIsLeft ? leftGoals <= rightGoals + 1 : leftGoals <= 0}
                  aria-label={t.removeGoal}
                >−</button>
                <span class="stepper__val">{leftGoals}</span>
                <button
                  class="stepper__btn"
                  onclick={() => bumpLeft(1)}
                  disabled={championIsLeft ? leftGoals >= GOAL_MAX : leftGoals >= rightGoals - 1}
                  aria-label={t.addGoal}
                >+</button>
              </div>
            </div>
            <span class="score-predict__sep" aria-hidden="true">:</span>
            <div class="score-predict__side">
              <div class="stepper" role="group" aria-label={t.goalsFor(teamName(right))}>
                <button
                  class="stepper__btn"
                  onclick={() => bumpRight(-1)}
                  disabled={championIsLeft ? rightGoals <= 0 : rightGoals <= leftGoals + 1}
                  aria-label={t.removeGoal}
                >−</button>
                <span class="stepper__val">{rightGoals}</span>
                <button
                  class="stepper__btn"
                  onclick={() => bumpRight(1)}
                  disabled={championIsLeft ? rightGoals >= leftGoals - 1 : rightGoals >= GOAL_MAX}
                  aria-label={t.addGoal}
                >+</button>
              </div>
              <img class="score-predict__flag" src={flagUrl(right)} alt="" />
            </div>
          </div>
          <button class="score-predict__ok" onclick={() => (scoreEditorOpen = false)}>
            {t.finalScoreDone}
          </button>
        </div>
      {:else}
        <button
          class="score-predict score-predict--chip"
          onclick={() => (scoreEditorOpen = true)}
          aria-label="{t.editFinalScore}: {teamName(left)} {leftGoals}, {teamName(
            right
          )} {rightGoals}"
        >
          <span class="score-chip__val" aria-hidden="true">
            {leftGoals}<span class="score-chip__sep">–</span>{rightGoals}
          </span>
        </button>
      {/if}
    {/if}
  </div>

  <footer class="site-footer">
    <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">{t.github}</a>
    <span aria-hidden="true">/</span>
    <a href="{REPOSITORY_URL}/compare" target="_blank" rel="noreferrer">{t.createPr}</a>
  </footer>
</main>

<!-- Off-screen, branded export card that gets rasterised into the share image.
     The stage holds it off-screen; the card itself stays normally positioned so
     html-to-image renders it inside its foreignObject viewport. The card mirrors
     the resolved on-screen theme via an explicit palette (light/dark modifier),
     and the bracket inside follows the same theme through its presentation
     attributes — so the export matches what the user sees. -->
{#if ready}
  <div class="export-stage" aria-hidden="true">
    <div class="export-card" class:export-card--dark={resolvedTheme === 'dark'} bind:this={exportCard}>
      <div class="export-card__inner">
        <div class="export-card__bracket">
          <BracketSvg {picks} {teamName} ariaLabel={t.bracketAria} idPrefix="export-" interactive={false} theme={resolvedTheme} />
        </div>
        <div class="export-card__footer">
          {#if champ}
            <div class="export-card__champ">
              <img class="export-card__champ-flag" src={flagUrl(champ)} alt="" />
              <span class="export-card__champ-name">{t.championWins(teamName(champ))}</span>
              {#if finalScore}
                <span class="export-card__champ-score">{finalScore.champ}–{finalScore.loser}</span>
              {/if}
            </div>
          {:else}
            <p class="export-card__neutral">{t.bracketSoFar}</p>
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
        <h2 id="share-modal-title">{t.shareTitle}</h2>
        <button
          class="share-close"
          onclick={closeShare}
          aria-label={t.shareClose}
          bind:this={closeBtn}
        >
          ×
        </button>
      </div>

      <div class="share-preview" aria-live="polite">
        {#if shareStatus === 'error'}
          <div class="share-preview__msg">{t.shareImageError}</div>
        {:else if imageUrl}
          <img class="share-preview__img" src={imageUrl} alt={t.sharePreviewAlt} />
        {:else}
          <div class="share-preview__msg share-preview__msg--loading">{t.shareRendering}</div>
        {/if}
      </div>

      <div class="share-actions">
        <button class="btn btn--go" onclick={copyImage} disabled={!imageBlob}>{t.copyImage}</button>
        <button class="btn" onclick={downloadPng} disabled={!imageBlob}>{t.downloadPng}</button>
        <button class="btn" onclick={copyLink}>{t.copyLink}</button>
        <button class="btn btn--x" onclick={shareToX} aria-label={t.shareToX}>
          <img src="/x-logo.svg" alt="" aria-hidden="true" />
        </button>
        {#if canNativeShare}
          <button class="btn" onclick={nativeShare}>{t.shareNative}</button>
        {/if}
      </div>

      <p class="share-status" aria-live="polite">{statusLabel || ' '}</p>
    </div>
  </div>
{/if}

{#if detailCard}
  <div class="detail-overlay" role="presentation" onclick={onDetailBackdropClick}>
    <div
      class="detail-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-card-title"
      tabindex="-1"
      bind:this={detailEl}
      onkeydown={onDetailKeydown}
    >
      <div class="detail-card__head">
        <h2 id="detail-card-title" class="detail-card__title">
          {t.matchup(detailCard.winnerName, detailCard.loserName)}
        </h2>
        <button
          class="share-close"
          onclick={closeDetail}
          aria-label={t.matchDetailClose}
          bind:this={detailCloseBtn}
        >
          ×
        </button>
      </div>

      {#if detailCard.score}
        <p class="detail-card__score">
          <img class="detail-card__flag" src={flagUrl(detailCard.winner)} alt="" aria-hidden="true" />
          <span class="detail-card__scoreline">
            {detailCard.score.winner}<span class="detail-card__dash" aria-hidden="true">–</span>{detailCard.score.loser}
          </span>
          <img class="detail-card__flag" src={flagUrl(detailCard.loser)} alt="" aria-hidden="true" />
        </p>
      {/if}

      {#if detailCard.venue || detailCard.kickoff}
        <dl class="detail-card__facts">
          {#if detailCard.venue}
            <div class="detail-fact">
              <dt>{t.matchVenue}</dt>
              <dd>{detailCard.venue.stadium} · {detailCard.venue.city}</dd>
            </div>
          {/if}
          {#if detailCard.kickoff}
            <div class="detail-fact">
              <dt>{t.matchKickoff}</dt>
              <dd>{formatKickoff(detailCard.kickoff, i18n.locale)}</dd>
            </div>
          {/if}
        </dl>
      {/if}

      {#if detailCard.extraTime || detailCard.penalties}
        <ul class="detail-card__status">
          {#if detailCard.extraTime}
            <li>{t.matchAfterExtraTime}</li>
          {/if}
          {#if detailCard.penalties}
            <li>
              {t.matchPenalties(
                detailCard.winnerName,
                `${detailCard.penalties.winner}–${detailCard.penalties.loser}`
              )}
            </li>
          {/if}
        </ul>
      {/if}

      {#if detailCard.goals && detailCard.goals.length}
        <div class="detail-card__goals">
          <h3>{t.matchGoals}</h3>
          <ul>
            {#each detailCard.goals as g, i (i)}
              <li>
                <img
                  class="detail-card__flag detail-card__flag--sm"
                  src={flagUrl(g.team)}
                  alt={teamName(g.team)}
                />
                <span class="detail-goal__scorer">
                  {g.scorer}{#if g.penalty}&nbsp;{t.matchGoalPenalty}{/if}
                </span>
                {#if g.minute != null}
                  <span class="detail-goal__minute">{g.minute}'</span>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if !detailHasBody}
        <p class="detail-card__empty">{t.matchNoDetails}</p>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* Fonts and the light/dark palette tokens now live in the root layout's
     global stylesheet ($lib/styles/theme.css) so the bracket and the error
     page share one source of truth. The styles below consume those tokens. */

  main {
    /* Wider than the bracket so the longer localized wordmarks ("Copa del
       Mundo 2026") keep "2026" on one line on larger screens. The bracket
       itself is pinned back to its original width on `.board` below. */
    max-width: 1040px;
    margin: 0 auto;
    padding: 1.25rem 1rem 2.5rem;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-bottom: 0.4rem;
  }
  .lang-switch {
    display: flex;
    gap: 0.4rem;
  }

  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    opacity: 0.72;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease,
      opacity 0.15s ease,
      transform 0.05s ease;
  }
  .theme-toggle svg {
    width: 1.05rem;
    height: 1.05rem;
  }
  .theme-toggle:hover {
    opacity: 1;
    color: var(--ink);
    background: var(--hover-bg);
    border-color: var(--hover-border);
  }
  .theme-toggle:active {
    transform: translateY(1px);
  }
  .theme-toggle:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .lang-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.28rem 0.62rem 0.28rem 0.34rem;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font-family: var(--mono);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    cursor: pointer;
    opacity: 0.72;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease,
      opacity 0.15s ease,
      transform 0.05s ease;
  }
  .lang-btn img {
    width: 1.15rem;
    height: 1.15rem;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: inset 0 0 0 1px var(--line);
    filter: saturate(0.45);
    transition: filter 0.15s ease;
  }
  .lang-btn:hover {
    opacity: 1;
    background: var(--hover-bg);
    border-color: var(--hover-border);
  }
  .lang-btn:active {
    transform: translateY(1px);
  }
  .lang-btn.active {
    opacity: 1;
    color: var(--ink);
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold-fill) 22%, transparent);
  }
  .lang-btn.active img {
    filter: none;
    box-shadow: 0 0 0 2px var(--gold);
  }
  .lang-btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
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
    background: var(--hover-bg);
    border-color: var(--hover-border);
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
    /* Always dark text — the gold fill stays light in both themes. */
    color: #1a1916;
  }
  .btn--go:hover {
    background: var(--gold);
    border-color: var(--gold);
  }
  .btn--x {
    min-width: 2.7rem;
    padding-inline: 0.8rem;
    /* The X mark is a brand asset — keep it on black in both themes so the
       white (inverted) logo always reads. */
    background: #1a1916;
    border-color: #1a1916;
    color: #f2efe4;
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
    max-width: 920px;
    margin-inline: auto;
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

  /* A transparent, focusable hit target laid over each SVG score pill (which the
     SVG paints underneath). Sized to the pill but never smaller than a
     comfortable tap target. */
  .pill-button {
    position: absolute;
    z-index: 3;
    top: var(--pill-y);
    left: var(--pill-x);
    width: max(var(--pill-w), 2.75rem);
    height: max(var(--pill-h), 1.6rem);
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
    transform: translate(-50%, -50%);
  }
  .pill-button:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  /* Sits just below the centre trophy and points up at it — only shown once
     every match but the final is filled (see `needsChampion`). */
  .champ-hint {
    position: absolute;
    z-index: 3;
    left: 50%;
    top: 63%;
    transform: translateX(-50%);
    pointer-events: none;
    animation: hint-in 0.3s ease backwards;
  }
  .champ-hint__pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    white-space: nowrap;
    padding: 0.4rem 0.7rem;
    border: 1px solid var(--gold);
    border-radius: 999px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--mono);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 4px 14px rgba(26, 25, 22, 0.18);
    animation: hint-bob 1.6s ease-in-out infinite;
  }
  .champ-hint__pill svg {
    width: 0.85rem;
    height: 0.85rem;
    color: var(--gold);
  }
  @keyframes hint-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(4px);
    }
  }
  @keyframes hint-bob {
    50% {
      transform: translateY(-3px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .champ-hint,
    .champ-hint__pill {
      animation: none;
    }
  }

  /* Grand-final score predictor — sits just below the crowned champion flag at
     the centre of the board. */
  .score-predict {
    position: absolute;
    z-index: 4;
    left: 50%;
    /* Below the crowned champion flag (its bottom edge is ~52%), with a small
       gap, sitting in the open central band that runs clear down to the lower
       ring of flags. */
    top: 55%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.8rem;
    border: 1px solid var(--gold);
    border-radius: 14px;
    background: color-mix(in srgb, var(--paper) 92%, transparent);
    box-shadow: 0 6px 18px rgba(26, 25, 22, 0.22);
    backdrop-filter: blur(3px);
    animation: hint-in 0.3s ease backwards;
  }
  .score-predict__label {
    font-family: var(--mono);
    font-size: 0.56rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
  }
  .score-predict__row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }
  .score-predict__side {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .score-predict__flag {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: inset 0 0 0 1.5px var(--gold);
  }
  .score-predict__sep {
    font-family: var(--display);
    font-weight: 900;
    color: var(--muted);
  }
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .stepper__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.4rem;
    height: 1.4rem;
    padding: 0;
    border: 1px solid var(--line);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    font-size: 0.9rem;
    line-height: 1;
    cursor: pointer;
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      transform 0.05s ease;
  }
  .stepper__btn:hover:not(:disabled) {
    background: var(--hover-bg);
    border-color: var(--gold);
  }
  .stepper__btn:active:not(:disabled) {
    transform: translateY(1px);
  }
  .stepper__btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .stepper__btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .stepper__val {
    min-width: 1.1rem;
    text-align: center;
    font-family: var(--display);
    font-weight: 900;
    font-size: 1.15rem;
    line-height: 1;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .score-predict__ok {
    margin-top: 0.1rem;
    padding: 0.28rem 1.1rem;
    border: 1px solid var(--gold);
    border-radius: 999px;
    background: var(--gold-fill);
    color: #1a1916;
    font-family: var(--mono);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      background 0.12s ease,
      transform 0.05s ease;
  }
  .score-predict__ok:hover {
    background: var(--gold);
  }
  .score-predict__ok:active {
    transform: translateY(1px);
  }
  .score-predict__ok:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  /* Collapsed resting state — the compact score, itself the button that
     reopens the editor. */
  .score-predict--chip {
    flex-direction: row;
    gap: 0;
    padding: 0.28rem 0.85rem;
    cursor: pointer;
    font: inherit;
    transition:
      background 0.12s ease,
      border-color 0.12s ease,
      transform 0.05s ease;
  }
  .score-predict--chip:hover {
    border-color: var(--gold);
    background: color-mix(in srgb, var(--gold-fill) 16%, var(--paper));
  }
  .score-predict--chip:active {
    transform: translateX(-50%) translateY(1px);
  }
  .score-predict--chip:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .score-chip__val {
    font-family: var(--display);
    font-weight: 900;
    font-size: 1.15rem;
    line-height: 1;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }
  .score-chip__sep {
    margin: 0 0.12rem;
    color: var(--muted);
  }
  @media (prefers-reduced-motion: reduce) {
    .score-predict {
      animation: none;
    }
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

  /* ---- share modal ------------------------------------------------------ */
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
    font-weight: 900;
    font-stretch: expanded;
    text-transform: uppercase;
    font-size: 1rem;
    letter-spacing: 0.02em;
    color: var(--ink);
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
    background: var(--hover-bg);
    color: var(--ink);
  }
  .share-close:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  /* ── Match detail card ─────────────────────────────────────────────────── */
  .detail-overlay {
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
  .detail-card {
    box-sizing: border-box;
    width: min(92vw, 380px);
    max-height: 92vh;
    overflow-y: auto;
    padding: 1.1rem 1.2rem 1.35rem;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(26, 25, 22, 0.35);
    animation: modal-in 0.18s cubic-bezier(0.2, 0.7, 0.2, 1);
  }
  .detail-card__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  .detail-card__title {
    margin: 0;
    font-family: var(--display);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    color: var(--ink);
  }
  .detail-card__score {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin: 0 0 1rem;
  }
  .detail-card__flag {
    width: 1.5rem;
    height: 1.05rem;
    object-fit: cover;
    border-radius: 2px;
    box-shadow: 0 0 0 1px var(--line);
  }
  .detail-card__flag--sm {
    width: 1.15rem;
    height: 0.8rem;
    flex: 0 0 auto;
  }
  .detail-card__scoreline {
    font-family: var(--mono);
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--ink);
    letter-spacing: 0.02em;
  }
  .detail-card__dash {
    margin: 0 0.15em;
    color: var(--muted);
  }
  .detail-card__facts {
    margin: 0 0 0.9rem;
    display: grid;
    gap: 0.65rem;
  }
  .detail-fact {
    display: grid;
    gap: 0.1rem;
  }
  .detail-fact dt {
    font-family: var(--mono);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .detail-fact dd {
    margin: 0;
    font-size: 0.9rem;
    color: var(--ink);
  }
  .detail-card__status {
    margin: 0 0 0.9rem;
    padding: 0.55rem 0.75rem;
    list-style: none;
    display: grid;
    gap: 0.25rem;
    background: var(--hover-bg);
    border: 1px solid var(--line);
    border-radius: 10px;
    font-size: 0.85rem;
    color: var(--ink);
  }
  .detail-card__goals h3 {
    margin: 0 0 0.4rem;
    font-family: var(--mono);
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .detail-card__goals ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 0.4rem;
  }
  .detail-card__goals li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--ink);
  }
  .detail-goal__scorer {
    flex: 1 1 auto;
  }
  .detail-goal__minute {
    font-family: var(--mono);
    font-size: 0.8rem;
    color: var(--muted);
  }
  .detail-card__empty {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  @media (prefers-reduced-motion: reduce) {
    .detail-overlay,
    .detail-card {
      animation: none;
    }
  }

  .share-preview {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    width: 100%;
    overflow: hidden;
    background: var(--empty-fill);
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
    /* An explicit palette (not light-dark()) because html-to-image rasterises
       from concrete computed colours. It mirrors the resolved on-screen theme:
       light by default, dark via the modifier below. The bracket's strokes
       follow the same theme through their presentation attributes. */
    --paper: #f2efe4;
    --ink: #1a1916;
    --muted: #7c7565;
    --gold: #c8992f;
    background: var(--paper);
    color: var(--ink);
  }
  .export-card--dark {
    --paper: #16140f;
    --ink: #ece7d6;
    --muted: #989083;
    --gold: #d8a93c;
  }
  .export-card__inner {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .export-card__bracket {
    /* Sized to fill most of the card. The bracket is slightly taller than wide
       (880×932 viewBox), so its height is the limiting dimension — this width
       fills the vertical budget left by the reserved footer. */
    width: 856px;
    /* Equal auto margins above and below (paired with the footer's auto
       margin-top) keep the bracket vertically centred now the title is gone. */
    margin-top: auto;
  }
  .export-card__footer {
    margin-top: auto;
    /* Reserve a fixed height so the taller champion call-out occupies the same
       footprint as the neutral caption — the bracket size above is then safe
       for either state. */
    min-height: 96px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .export-card__champ {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .export-card__champ-flag {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--gold);
  }
  .export-card__champ-name {
    font-family: var(--display);
    font-weight: 900;
    font-stretch: expanded;
    text-transform: uppercase;
    font-size: 38px;
    line-height: 1;
    white-space: nowrap;
  }
  .export-card__champ-score {
    display: flex;
    align-items: center;
    /* Match the champion flag (60px circle + 3px ring) so the scoreline reads
       as its counterweight. */
    height: 66px;
    font-family: var(--display);
    font-weight: 900;
    font-stretch: expanded;
    font-size: 66px;
    line-height: 1;
    letter-spacing: 0.01em;
    color: var(--gold);
    font-variant-numeric: tabular-nums;
  }
  .export-card__neutral {
    margin: 0;
    font-family: var(--display);
    font-weight: 900;
    font-stretch: expanded;
    text-transform: uppercase;
    font-size: 32px;
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
