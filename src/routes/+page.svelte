<script lang="ts">
  import 'flag-icons/css/flag-icons.min.css';
  import { onMount } from 'svelte';

  import {
    allNodes,
    connectors,
    matchById,
    CX,
    CY,
    VW,
    VH
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
  let copied = $state(false);

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
  async function share() {
    try {
      await navigator.clipboard.writeText(location.href);
      copied = true;
      setTimeout(() => (copied = false), 1600);
    } catch {
      copied = false;
    }
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
        <span class="fi fis fi-{champ} readout__flag" aria-hidden="true"></span>
        <span class="readout__name">{TEAMS[champ].name}</span>
      {:else}
        <span class="readout__num">{decided}</span>
        <span class="readout__den">/ 31</span>
        <span class="readout__tag">ties picked</span>
      {/if}
    </div>

    <p class="hint">
      {#if champ}
        Bracket complete — copy the link to share it.
      {:else}
        Pick the winner of every tie. Your bracket saves to the link.
      {/if}
    </p>

    <div class="actions">
      <button class="btn btn--go" onclick={share}>{copied ? 'Copied ✓' : 'Copy link'}</button>
      <button class="btn" onclick={loadReal} title="Load the real-world results from config.ts">
        Real results
      </button>
      <button class="btn" onclick={clearAll}>Clear</button>
    </div>
  </header>

  <div class="board">
    <svg viewBox="0 0 {VW} {VH}" role="group" aria-label="{TITLE} bracket">
      {#each connectors as c}
        <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} class="conn" />
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
          <circle r="46" class="champion-ring" />
          <foreignObject x={-44} y={-44} width={88} height={88}>
            <div xmlns="http://www.w3.org/1999/xhtml" class="flagwrap">
              <span class="fi fis fi-{champ}"></span>
            </div>
          </foreignObject>
          <g transform="translate(0,-70)">{@render trophy(0.28)}</g>
        </g>
      {:else}
        <g transform="translate({CX},{CY})">{@render trophy(0.92)}</g>
      {/if}

      {#each allNodes as n (n.id)}
        {@const team = teamOf(n.id)}
        {@const isChampSeat = champNode === n.id}
        <g
          transform="translate({n.x},{n.y})"
          data-node={n.id}
          class="node"
          class:clickable={team}
          class:flash={flashing.has(n.id)}
          class:champseat={isChampSeat}
          role={team ? 'button' : undefined}
          tabindex={team ? 0 : undefined}
          aria-label={team ? TEAMS[team].name : 'Awaiting winner'}
          onclick={() => pick(n.id)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), pick(n.id))}
        >
          <circle r={n.r} class="ring" class:empty={!team} />
          {#if team}
            <foreignObject x={-n.r} y={-n.r} width={n.r * 2} height={n.r * 2}>
              <div xmlns="http://www.w3.org/1999/xhtml" class="flagwrap">
                <span class="fi fis fi-{team}"></span>
              </div>
            </foreignObject>
          {/if}
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
    border-radius: 2px;
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
    stroke-width: 1.4;
    fill: none;
  }
  .champion-ring {
    fill: #f2efe4;
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
  .node.clickable:hover .ring,
  .node.clickable:focus-visible .ring {
    stroke: #d9b34a;
    stroke-width: 3;
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

  .flagwrap {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
  }
  .flagwrap :global(.fi) {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    line-height: 1;
  }
</style>
