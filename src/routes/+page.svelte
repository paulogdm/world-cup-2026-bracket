<script lang="ts">
  import { onMount } from 'svelte';
  import flagAr from 'flag-icons/flags/1x1/ar.svg?url';
  import flagAt from 'flag-icons/flags/1x1/at.svg?url';
  import flagAu from 'flag-icons/flags/1x1/au.svg?url';
  import flagBa from 'flag-icons/flags/1x1/ba.svg?url';
  import flagBe from 'flag-icons/flags/1x1/be.svg?url';
  import flagBr from 'flag-icons/flags/1x1/br.svg?url';
  import flagCa from 'flag-icons/flags/1x1/ca.svg?url';
  import flagCd from 'flag-icons/flags/1x1/cd.svg?url';
  import flagCh from 'flag-icons/flags/1x1/ch.svg?url';
  import flagCi from 'flag-icons/flags/1x1/ci.svg?url';
  import flagCo from 'flag-icons/flags/1x1/co.svg?url';
  import flagCv from 'flag-icons/flags/1x1/cv.svg?url';
  import flagDe from 'flag-icons/flags/1x1/de.svg?url';
  import flagDz from 'flag-icons/flags/1x1/dz.svg?url';
  import flagEc from 'flag-icons/flags/1x1/ec.svg?url';
  import flagEg from 'flag-icons/flags/1x1/eg.svg?url';
  import flagEs from 'flag-icons/flags/1x1/es.svg?url';
  import flagFr from 'flag-icons/flags/1x1/fr.svg?url';
  import flagGbEng from 'flag-icons/flags/1x1/gb-eng.svg?url';
  import flagGh from 'flag-icons/flags/1x1/gh.svg?url';
  import flagHr from 'flag-icons/flags/1x1/hr.svg?url';
  import flagJp from 'flag-icons/flags/1x1/jp.svg?url';
  import flagMa from 'flag-icons/flags/1x1/ma.svg?url';
  import flagMx from 'flag-icons/flags/1x1/mx.svg?url';
  import flagNl from 'flag-icons/flags/1x1/nl.svg?url';
  import flagNo from 'flag-icons/flags/1x1/no.svg?url';
  import flagPt from 'flag-icons/flags/1x1/pt.svg?url';
  import flagPy from 'flag-icons/flags/1x1/py.svg?url';
  import flagSe from 'flag-icons/flags/1x1/se.svg?url';
  import flagSn from 'flag-icons/flags/1x1/sn.svg?url';
  import flagUs from 'flag-icons/flags/1x1/us.svg?url';
  import flagZa from 'flag-icons/flags/1x1/za.svg?url';

  import {
    allNodes,
    connectors,
    matchById,
    CX,
    CY,
    VW,
    VH,
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
  const flagUrls: Record<TeamId, string> = {
    ar: flagAr,
    at: flagAt,
    au: flagAu,
    ba: flagBa,
    be: flagBe,
    br: flagBr,
    ca: flagCa,
    cd: flagCd,
    ch: flagCh,
    ci: flagCi,
    co: flagCo,
    cv: flagCv,
    de: flagDe,
    dz: flagDz,
    ec: flagEc,
    eg: flagEg,
    es: flagEs,
    fr: flagFr,
    'gb-eng': flagGbEng,
    gh: flagGh,
    hr: flagHr,
    jp: flagJp,
    ma: flagMa,
    mx: flagMx,
    nl: flagNl,
    no: flagNo,
    pt: flagPt,
    py: flagPy,
    se: flagSe,
    sn: flagSn,
    us: flagUs,
    za: flagZa
  };

  function flagUrl(team: TeamId): string {
    return flagUrls[team];
  }

  function polarPoint(angle: number, radius: number) {
    return {
      x: CX + radius * Math.cos(angle),
      y: CY - radius * Math.sin(angle)
    };
  }

  function connectorPath(c: Connector): string {
    const startAngle = Math.atan2(CY - c.y1, c.x1 - CX);
    const endAngle = Math.atan2(CY - c.y2, c.x2 - CX);
    const startRadius = Math.hypot(c.x1 - CX, c.y1 - CY);
    const endRadius = Math.hypot(c.x2 - CX, c.y2 - CY);

    if (endRadius < 1) {
      const control = polarPoint(startAngle, startRadius * 0.42);
      return `M ${c.x1} ${c.y1} Q ${control.x} ${control.y} ${c.x2} ${c.y2}`;
    }

    const bendRadius = (startRadius + endRadius) / 2;
    const startBend = polarPoint(startAngle, bendRadius);
    const endBend = polarPoint(endAngle, bendRadius);
    const rawDelta = endAngle - startAngle;
    const delta = Math.atan2(Math.sin(rawDelta), Math.cos(rawDelta));
    const sweep = delta < 0 ? 1 : 0;

    return [
      `M ${c.x1} ${c.y1}`,
      `L ${startBend.x} ${startBend.y}`,
      `A ${bendRadius} ${bendRadius} 0 0 ${sweep} ${endBend.x} ${endBend.y}`,
      `L ${c.x2} ${c.y2}`
    ].join(' ');
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
      const nextMatch = matchById(nextNode);
      id = nextMatch?.id ?? null;
    }

    return false;
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
    const colors = TEAMS[winner].flagColors;
    const opts = { colors, disableForReducedMotion: true, zIndex: 9999 };
    confetti({ ...opts, particleCount: 130, spread: 90, startVelocity: 45, origin: { y: 0.4 } });
    confetti({ ...opts, particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.6 } });
    confetti({ ...opts, particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.6 } });
  }

  function teamOf(id: string): TeamId | undefined {
    return resolveTeam(id, picks);
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
    const tieLabel = decided === 1 ? 'tie' : 'ties';
    return champ
      ? `I picked ${TEAMS[champ].name} to win the ${TITLE}.`
      : `I picked ${decided} ${tieLabel} in the ${TITLE} knockout predictor.`;
  }

  async function share() {
    const data = {
      title: TITLE,
      text: shareText(),
      url: location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
        shareStatus = 'shared';
      } else {
        await navigator.clipboard.writeText(data.url);
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
    url.searchParams.set('url', location.href);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const decided = $derived(Object.keys(picks).length);
</script>

<svelte:head>
  <title>{TITLE} — Interactive Bracket</title>
</svelte:head>

<main>
  <header class="masthead">
    <p class="eyebrow">Knockout predictor — USA · Canada · Mexico</p>
    <h1 class="wordmark">World Cup <span class="yr">2026</span></h1>

    <div class="readout" aria-live="polite">
      {#if champ}
        <span class="readout__crown">Champions</span>
        <img class="readout__flag" src={flagUrl(champ)} alt="" aria-hidden="true" />
        <span class="readout__name">{TEAMS[champ].name}</span>
      {:else}
        <span class="readout__num">{decided}</span>
        <span class="readout__den">/ 31</span>
        <span class="readout__tag">ties picked</span>
      {/if}
    </div>

    <p class="hint">
      {#if champ}
        Bracket complete — share the link.
      {:else}
        Pick the winner of every tie. Your bracket saves to the link.
      {/if}
    </p>

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
    <svg viewBox="0 0 {VW} {VH}" role="group" aria-label="{TITLE} bracket">
      {#each connectors as c}
        <path
          d={connectorPath(c)}
          class="conn"
          class:conn--picked={picks[c.matchId] === c.side}
          class:conn--champion={isChampionConnector(c.matchId, c.side)}
        />
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
        <g
          transform="translate({n.x},{n.y})"
          data-node={n.id}
          class="node"
          class:clickable={team}
          class:flash={flashing.has(n.id)}
          class:champseat={isChampSeat}
          class:picked={isPicked}
          class:championpick={isChampionPick}
          role={team ? 'button' : undefined}
          tabindex={team ? 0 : undefined}
          aria-label={team ? TEAMS[team].name : 'Awaiting winner'}
          onclick={() => pick(n.id)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(n.id))}
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
        </g>
      {/each}
    </svg>
  </div>
</main>

<style>
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
    padding-bottom: 0.5rem;
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
    margin-top: 0.85rem;
  }
  .readout__num {
    font-family: var(--display);
    font-weight: 800;
    font-stretch: 125%;
    font-size: 1.75rem;
    line-height: 1;
    color: var(--ink);
  }
  .readout__den {
    font-family: var(--mono);
    font-size: 1rem;
    color: var(--muted);
  }
  .readout__tag {
    font-family: var(--mono);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--muted);
    margin-left: 0.35rem;
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

  .hint {
    margin: 0.45rem auto 1.1rem;
    max-width: 30rem;
    font-family: var(--mono);
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--muted);
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
    width: 100%;
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
    stroke: var(--green);
    stroke-width: 3.5;
    opacity: 1;
    filter: drop-shadow(0 0 5px rgba(28, 122, 61, 0.45));
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
  .node.clickable:hover .ring,
  .node.clickable:focus-visible .ring {
    stroke: #d9b34a;
    stroke-width: 3;
  }

  .picked .ring {
    stroke: var(--green);
    stroke-width: 3;
    filter: drop-shadow(0 0 5px rgba(28, 122, 61, 0.45));
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
