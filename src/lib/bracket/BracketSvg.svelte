<script lang="ts">
  import {
    allNodes,
    connectors,
    finalChildren,
    getMatchById,
    matchById,
    CX,
    CY,
    VW,
    VH,
    type BracketNode,
    type Connector
  } from './structure';
  import { resolveTeam, champion, championNode, type Picks } from './state';
  import { type TeamId } from './teams';
  import { flagUrl, flagAccentColor } from './flags';

  interface Props {
    picks: Picks;
    /** Localized country name for a team — used for popover labels. */
    teamName: (id: TeamId) => string;
    /** Accessible label for the bracket <svg>. */
    ariaLabel: string;
    /** Prefixes clip-path ids so multiple instances can coexist without id collisions. */
    idPrefix?: string;
    /** Set when rendered on-screen; the export card passes its static, non-interactive state. */
    interactive?: boolean;
    activePopoverNode?: string | null;
    flashing?: Set<string>;
    /** Resolved colour theme — drives the presentation-attribute palette that
        survives rasterisation, so the export image matches the on-screen theme. */
    theme?: 'light' | 'dark';
  }

  let {
    picks,
    teamName,
    ariaLabel,
    idPrefix = '',
    interactive = true,
    activePopoverNode = null,
    flashing = new Set<string>(),
    theme = 'light'
  }: Props = $props();

  const TROPHY_IMAGE_URL = '/world-cup-trophy.svg';
  const BRACKET_TOP_CROP = 48;
  const BRACKET_VIEW_HEIGHT = VH - BRACKET_TOP_CROP;

  const champ = $derived(champion(picks));
  const champNode = $derived(championNode(picks));

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

  function teamOf(id: string): TeamId | undefined {
    return resolveTeam(id, picks);
  }

  // Stroke/fill colours mirror the theme.css tokens (light/dark sides of each
  // light-dark()). They're applied as presentation attributes too because
  // html-to-image copies the SVG as raw markup without the scoped stylesheet —
  // only attributes survive the capture. The scoped CSS still wins on-screen, so
  // the live look is unchanged; these values surface in the export image and
  // follow the resolved theme so the export matches what's on screen.
  const PALETTE = {
    light: {
      gold: '#c8992f',
      champSeat: '#d9b34a',
      ringBase: '#2a2925',
      emptyFill: '#e9e5d8',
      emptyStroke: '#b8b3a3'
    },
    dark: {
      gold: '#d8a93c',
      champSeat: '#e6c25c',
      ringBase: '#5f5a4e',
      emptyFill: '#232017',
      emptyStroke: '#585346'
    }
  } as const;
  const pal = $derived(PALETTE[theme]);

  // A filled finalist still waiting to be crowned — the contender the user is
  // meant to choose between for the championship.
  const isFinalist = (id: string) => finalChildren.includes(id);

  function ringStroke(
    team: TeamId | undefined,
    isChampSeat: boolean,
    isPicked: boolean,
    isChampionPick: boolean,
    isContender: boolean
  ): string {
    if (isChampSeat) return pal.champSeat;
    if (isChampionPick) return pal.gold;
    if (isContender) return pal.gold;
    if (isPicked && team) return flagAccentColor(team);
    if (team) return pal.ringBase;
    return pal.emptyStroke;
  }

  function ringWidth(
    isChampSeat: boolean,
    isPicked: boolean,
    isChampionPick: boolean,
    isContender: boolean
  ): number {
    if (isChampSeat) return 4;
    if (isContender) return 4;
    if (isChampionPick) return 3.5;
    if (isPicked) return 3;
    return 1.5;
  }
</script>

<svg
  class="bracket-svg"
  class:bracket-svg--static={!interactive}
  viewBox="0 {BRACKET_TOP_CROP} {VW} {BRACKET_VIEW_HEIGHT}"
  role="group"
  aria-label={ariaLabel}
>
  {#each connectors as c}
    <path
      d={c.path}
      class="conn"
      fill="none"
      stroke={pal.ringBase}
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.5"
    />
  {/each}
  {#each connectors as c}
    {#if picks[c.matchId] === c.side}
      {@const isChamp = isChampionConnector(c.matchId, c.side)}
      <path
        d={c.path}
        class="conn conn--picked"
        class:conn--champion={isChamp}
        style:--pick-color={connectorColor(c)}
        fill="none"
        stroke={isChamp ? pal.gold : connectorColor(c)}
        stroke-width={isChamp ? 4.5 : 3.5}
        stroke-linecap="round"
        stroke-linejoin="round"
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
      <clipPath id="{idPrefix}champion-flag-clip">
        <circle r="44" />
      </clipPath>
      <image
        href={flagUrl(champ)}
        x={-44}
        y={-44}
        width={88}
        height={88}
        preserveAspectRatio="xMidYMid slice"
        clip-path="url(#{idPrefix}champion-flag-clip)"
      />
      <circle r="46" class="champion-ring" fill="none" stroke={pal.champSeat} stroke-width="5" />
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
    {@const isContender = !champ && team !== undefined && isFinalist(n.id)}
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
      class:contender={isContender}
      class:active={isActive}
      style:--pick-color={team ? flagAccentColor(team) : undefined}
    >
      {#if team}
        <clipPath id="{idPrefix}flag-clip-{n.id}">
          <circle r={n.r} />
        </clipPath>
        <image
          href={flagUrl(team)}
          x={-n.r}
          y={-n.r}
          width={n.r * 2}
          height={n.r * 2}
          preserveAspectRatio="xMidYMid slice"
          clip-path="url(#{idPrefix}flag-clip-{n.id})"
        />
      {/if}
      <!-- Explicit fill/stroke presentation attributes (the scoped CSS still
           wins on-screen) so the ring survives rasterisation; html-to-image
           otherwise drops the class-based fill and the SVG default black hides
           the flag. -->
      <circle
        r={n.r}
        class="ring"
        class:empty={!team}
        class:filled={team}
        fill={team ? 'none' : pal.emptyFill}
        stroke={ringStroke(team, isChampSeat, isPicked, isChampionPick, isContender)}
        stroke-width={ringWidth(isChampSeat, isPicked, isChampionPick, isContender)}
      />
    </g>
  {/each}

  <!-- Popovers render in a second pass so they paint after every node group.
       SVG ignores CSS z-index, so paint order is document order — keeping the
       pill nested in its node let neighbouring circles drawn later occlude it. -->
  {#if interactive}
    {#each allNodes as n (n.id)}
      {@const team = teamOf(n.id)}
      {#if team && activePopoverNode === n.id}
        {@const name = teamName(team)}
        <g
          class="country-popover country-popover--visible"
          transform="translate({n.x},{n.y - n.r - 18})"
        >
          <rect x={-name.length * 3.8 - 10} y="-16" width={name.length * 7.6 + 20} height="24" rx="12" />
          <text text-anchor="middle" dominant-baseline="middle" y="-4">
            {name}
          </text>
        </g>
      {/if}
    {/each}
  {/if}
</svg>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }

  /* The export card captures a single frame, so entrance animations must not
     leave the champion ring mid-transition (scaled down / transparent). */
  .bracket-svg--static .champion-ring,
  .bracket-svg--static .flash .ring {
    animation: none;
  }

  .conn {
    stroke: var(--stroke);
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
    stroke: var(--gold-bright);
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
    fill: var(--ring-fill);
    stroke: var(--stroke);
    stroke-width: 1.5;
    transition:
      stroke 0.2s,
      r 0.2s;
  }
  .ring.empty {
    fill: var(--empty-fill);
    stroke: var(--empty-stroke);
    stroke-dasharray: 3 3;
  }
  .ring.filled {
    fill: none;
  }
  .node.active .ring {
    stroke: var(--gold-bright);
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
    stroke: var(--gold-bright);
    stroke-width: 4;
    filter: drop-shadow(0 0 6px rgba(217, 179, 74, 0.8));
  }

  /* The two filled finalists before a champion is crowned — pulse to invite the
     final pick. The active (hover/focus) ring still wins via the rule above. */
  .contender .ring {
    stroke: var(--gold);
    stroke-width: 4;
    filter: drop-shadow(0 0 6px rgba(217, 179, 74, 0.7));
    animation: contender-pulse 1s ease-in-out infinite;
  }
  @keyframes contender-pulse {
    0%,
    100% {
      stroke: var(--gold);
      stroke-width: 3;
      filter: drop-shadow(0 0 3px rgba(217, 179, 74, 0.5));
    }
    50% {
      stroke: var(--gold-bright);
      stroke-width: 7;
      filter: drop-shadow(0 0 16px rgba(217, 179, 74, 1));
    }
  }
  /* The export card captures one frame — no mid-pulse stroke. */
  .bracket-svg--static .contender .ring {
    animation: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .contender .ring {
      animation: none;
    }
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
      stroke: var(--flash);
      stroke-width: 5;
    }
    100% {
      stroke: var(--empty-stroke);
      stroke-width: 1.5;
    }
  }
</style>
