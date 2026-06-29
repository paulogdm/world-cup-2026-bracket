<script lang="ts">
  import { onMount } from 'svelte';

  import {
    allNodes,
    connectors,
    getMatchById,
    matchById,
    CX,
    CY,
    VW,
    VH,
    type BracketNode,
    type Connector
  } from '$lib/bracket/structure';
  import {
    resolveTeam,
    champion,
    championNode,
    encode,
    decode,
    applyPick,
    picksFromResults,
    type Picks
  } from '$lib/bracket/state';
  import { TEAMS, type TeamId } from '$lib/bracket/teams';
  import { defaultResults, TITLE } from '$lib/bracket/config';

  let picks = $state<Picks>({});
  let flashing = $state<Set<string>>(new Set());
  let ready = $state(false);
  let shareStatus = $state<'idle' | 'shared' | 'copied'>('idle');
  let activePopoverNode = $state<string | null>(null);

  // Initial state: shared bracket from the URL, else the real-world default.
  onMount(() => {
    const b = new URLSearchParams(location.search).get('b');
    picks = b ? decode(b) : picksFromResults(defaultResults);
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
  });

  const champ = $derived(champion(picks));
  const champNode = $derived(championNode(picks));
  const TROPHY_IMAGE_URL = '/world-cup-trophy.svg';
  const REPOSITORY_URL = 'https://github.com/paulogdm/world-cup-2026-bracket';
  const BRACKET_TOP_CROP = 48;
  const BRACKET_VIEW_HEIGHT = VH - BRACKET_TOP_CROP;
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

  function flagUrl(team: TeamId): string {
    return flagUrls[team];
  }

  function flagAccentColor(team: TeamId) {
    return (
      TEAMS[team].flagColors.find((color) => !['#ffffff', '#000000'].includes(color.toLowerCase())) ??
      TEAMS[team].flagColors[0]
    );
  }

  function isChampionConnector(matchId: string, side: 0 | 1) {
    if (!champ) return false;
    let id: string | null = 'F';

    while (id) {
      const selected = picks[id];
      if (selected === undefined) return false;
      if (id === matchId) return selected === side;

      const match = matchById(id);
      const nextNode = selected === 0 ? match.a : match.b;
      const nextMatch = getMatchById(nextNode);
      id = nextMatch?.id ?? null;
    }

    return false;
  }

  function connectorTeam(c: Connector): TeamId | undefined {
    if (picks[c.matchId] !== c.side) return undefined;
    const match = matchById(c.matchId);
    const child = c.side === 0 ? match.a : match.b;
    return resolveTeam(child, picks);
  }

  function connectorColor(c: Connector): string | undefined {
    const team = connectorTeam(c);
    return team ? flagAccentColor(team) : undefined;
  }

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
      ? `Check my prediction: ${TEAMS[champ].name} will be champion! ${location.href}`
      : `Check the interactive knockout stage here: ${location.href}`;
  }

  async function share() {
    const data = {
      title: TITLE,
      text: shareText()
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
        shareStatus = 'shared';
      } else {
        await navigator.clipboard.writeText(data.text);
        shareStatus = 'copied';
      }
      setTimeout(() => (shareStatus = 'idle'), 1600);
    } catch {
      shareStatus = 'idle';
    }
  }

  function shareToX() {
    const url = new URL('https://twitter.com/intent/tweet');
    url.searchParams.set('text', shareText());
    window.open(url, '_blank', 'noopener,noreferrer');
  }

</script>

<svelte:head>
  <title>{TITLE} — Interactive Bracket</title>
</svelte:head>

<main>
  <header class="masthead">
    <p class="eyebrow">Knockout predictor — USA · Canada · Mexico</p>
    <h1 class="wordmark">World Cup <span class="yr">2026</span></h1>

    <div class="readout" class:readout--empty={!champ} aria-live="polite">
      {#if champ}
        <span class="readout__crown">Champions</span>
        <img class="readout__flag" src={flagUrl(champ)} alt="" aria-hidden="true" />
        <span class="readout__name">{TEAMS[champ].name}</span>
      {/if}
    </div>

    <div class="actions">
      <button class="btn btn--go" onclick={share}>
        {shareStatus === 'shared' ? 'Shared' : shareStatus === 'copied' ? 'Link copied' : 'Share'}
      </button>
      <button class="btn btn--x" onclick={shareToX} aria-label="Share to X">
        <img src="/x-logo.svg" alt="" aria-hidden="true" />
      </button>
      <button class="btn" onclick={loadReal} title="Load the real-world results from config.ts">
        Real results
      </button>
      <button class="btn" onclick={clearAll}>Clear</button>
    </div>
  </header>

  <div class="board">
    <svg viewBox="0 {BRACKET_TOP_CROP} {VW} {BRACKET_VIEW_HEIGHT}" role="group" aria-label="{TITLE} bracket">
      {#each connectors as c}
        <path d={c.path} class="conn" />
      {/each}
      {#each connectors as c}
        {#if picks[c.matchId] === c.side}
          <path
            d={c.path}
            class="conn conn--picked"
            class:conn--champion={isChampionConnector(c.matchId, c.side)}
            style:--pick-color={connectorColor(c)}
          />
        {/if}
      {/each}

      <!-- The FIFA World Cup trophy. -->
      {#snippet trophy(scale: number)}
        <g transform="scale({scale})">
          <image
            href={TROPHY_IMAGE_URL}
            x="-58"
            y="-138"
            width="116"
            height="270"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      {/snippet}

      <!-- centre: trophy until the final is decided, then the champion writ large -->
      {#if champ}
        <g class="champion" transform="translate({CX},{CY})">
          <clipPath id="champion-flag-clip">
            <circle r="44" />
          </clipPath>
          <image
            href={flagUrl(champ)}
            x={-44}
            y={-44}
            width={88}
            height={88}
            preserveAspectRatio="xMidYMid slice"
            clip-path="url(#champion-flag-clip)"
          />
          <circle r="46" class="champion-ring" />
          <g transform="translate(0,-70)">{@render trophy(0.28)}</g>
        </g>
      {:else}
        <g transform="translate({CX},{CY})">{@render trophy(0.92)}</g>
      {/if}

      {#each allNodes as n (n.id)}
        {@const team = teamOf(n.id)}
        {@const isChampSeat = champNode === n.id}
        {@const isPicked = n.parentMatch !== undefined && n.side !== undefined && picks[n.parentMatch] === n.side}
        {@const isChampionPick = n.parentMatch !== undefined && n.side !== undefined && isChampionConnector(n.parentMatch, n.side)}
        {@const isActive = activePopoverNode === n.id}
        <g
          transform="translate({n.x},{n.y})"
          data-node={n.id}
          class="node"
          class:clickable={team !== undefined}
          class:flash={flashing.has(n.id)}
          class:champseat={isChampSeat}
          class:picked={isPicked}
          class:championpick={isChampionPick}
          class:active={isActive}
          style:--pick-color={team ? flagAccentColor(team) : undefined}
        >
          {#if team}
            <clipPath id="flag-clip-{n.id}">
              <circle r={n.r} />
            </clipPath>
            <image
              href={flagUrl(team)}
              x={-n.r}
              y={-n.r}
              width={n.r * 2}
              height={n.r * 2}
              preserveAspectRatio="xMidYMid slice"
              clip-path="url(#flag-clip-{n.id})"
            />
          {/if}
          <circle r={n.r} class="ring" class:empty={!team} class:filled={team} />
          {#if team}
            <g
              class="country-popover"
              class:country-popover--visible={activePopoverNode === n.id}
              transform="translate(0,{-n.r - 18})"
            >
              <rect
                x={-TEAMS[team].name.length * 3.8 - 10}
                y="-16"
                width={TEAMS[team].name.length * 7.6 + 20}
                height="24"
                rx="12"
              />
              <text text-anchor="middle" dominant-baseline="middle" y="-4">
                {TEAMS[team].name}
              </text>
            </g>
          {/if}
        </g>
      {/each}
    </svg>
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

  <footer class="site-footer">
    <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">GitHub</a>
    <span aria-hidden="true">/</span>
    <a href="{REPOSITORY_URL}/compare" target="_blank" rel="noreferrer">Create a PR</a>
  </footer>
</main>

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
  .readout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    min-height: 2.4rem;
    margin-block: 14px;
  }
  .readout--empty {
    visibility: hidden;
  }
  .readout__crown {
    font-family: var(--mono);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .readout__flag {
    width: 1.7em;
    height: 1.7em;
    border-radius: 50%;
    object-fit: cover;
    box-shadow:
      0 0 0 2px var(--paper),
      0 0 0 4px var(--gold-fill);
  }
  .readout__name {
    font-family: var(--display);
    font-weight: 800;
    font-stretch: 125%;
    font-size: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.005em;
    color: var(--ink);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
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
  .btn--go {
    background: var(--gold-fill);
    border-color: var(--gold);
    color: var(--ink);
  }
  .btn--go:hover {
    background: var(--gold);
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

  svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }

  .conn {
    stroke: #2a2925;
    stroke-width: 1.7;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.5;
    transition:
      opacity 0.2s ease,
      stroke 0.2s ease,
      stroke-width 0.2s ease,
      filter 0.2s ease;
  }
  .conn--picked {
    stroke: var(--pick-color, var(--green));
    stroke-width: 3.5;
    opacity: 1;
    filter: drop-shadow(0 0 5px color-mix(in srgb, var(--pick-color, var(--green)) 45%, transparent));
  }
  .conn--champion {
    stroke: var(--gold);
    stroke-width: 4.5;
    filter: drop-shadow(0 0 6px rgba(217, 179, 74, 0.65));
  }
  .champion-ring {
    fill: none;
    stroke: #d9b34a;
    stroke-width: 5;
    filter: drop-shadow(0 0 10px rgba(217, 179, 74, 0.85));
    animation: pop 0.35s ease-out;
  }
  @keyframes pop {
    0% {
      transform: scale(0.6);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .node {
    outline: none;
  }
  .node.clickable {
    cursor: pointer;
  }
  .ring {
    fill: #f2efe4;
    stroke: #2a2925;
    stroke-width: 1.5;
    transition:
      stroke 0.2s,
      r 0.2s;
  }
  .ring.empty {
    fill: #e9e5d8;
    stroke: #b8b3a3;
    stroke-dasharray: 3 3;
  }
  .ring.filled {
    fill: none;
  }
  .node.active .ring {
    stroke: #d9b34a;
    stroke-width: 3;
  }

  .picked .ring {
    stroke: var(--pick-color, var(--green));
    stroke-width: 3;
    filter: drop-shadow(0 0 5px color-mix(in srgb, var(--pick-color, var(--green)) 45%, transparent));
  }

  .championpick .ring {
    stroke: var(--gold);
    stroke-width: 3.5;
    filter: drop-shadow(0 0 5px rgba(217, 179, 74, 0.65));
  }

  .champseat .ring {
    stroke: #d9b34a;
    stroke-width: 4;
    filter: drop-shadow(0 0 6px rgba(217, 179, 74, 0.8));
  }

  .country-popover {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }
  .country-popover rect {
    fill: var(--ink);
    stroke: rgba(242, 239, 228, 0.42);
    stroke-width: 1;
    filter: drop-shadow(0 2px 5px rgba(26, 25, 22, 0.22));
  }
  .country-popover text {
    fill: var(--paper);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }
  .country-popover--visible {
    opacity: 1;
  }

  .flash .ring {
    animation: flash 0.7s ease-out;
  }
  @keyframes flash {
    0% {
      stroke: #d96a4a;
      stroke-width: 5;
    }
    100% {
      stroke: #b8b3a3;
      stroke-width: 1.5;
    }
  }

</style>
