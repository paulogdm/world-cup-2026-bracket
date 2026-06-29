<script lang="ts">
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
  } from './structure';
  import { resolveTeam, champion, championNode, type Picks } from './state';
  import { TEAMS, type TeamId } from './teams';
  import { TITLE } from './config';
  import { flagUrl, flagAccentColor } from './flags';

  interface Props {
    picks: Picks;
    /** Prefixes clip-path ids so multiple instances can coexist without id collisions. */
    idPrefix?: string;
    /** Set when rendered on-screen; the export card passes its static, non-interactive state. */
    interactive?: boolean;
    activePopoverNode?: string | null;
    flashing?: Set<string>;
  }

  let {
    picks,
    idPrefix = '',
    interactive = true,
    activePopoverNode = null,
    flashing = new Set<string>()
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

  // Stroke colours mirror the scoped CSS. They're applied as presentation
  // attributes too because html-to-image copies the SVG as raw markup without
  // the external stylesheet — only attributes survive the capture. CSS still
  // wins on-screen, so the live look (widths, glows) is unchanged.
  const GOLD = '#c8992f';
  const CHAMP_SEAT = '#d9b34a';
  const RING_BASE = '#2a2925';
  const RING_EMPTY = '#b8b3a3';

  function ringStroke(
    team: TeamId | undefined,
    isChampSeat: boolean,
    isPicked: boolean,
    isChampionPick: boolean
  ): string {
    if (isChampSeat) return CHAMP_SEAT;
    if (isChampionPick) return GOLD;
    if (isPicked && team) return flagAccentColor(team);
    if (team) return RING_BASE;
    return RING_EMPTY;
  }

  function ringWidth(isChampSeat: boolean, isPicked: boolean, isChampionPick: boolean): number {
    if (isChampSeat) return 4;
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
  aria-label="{TITLE} bracket"
>
  {#each connectors as c}
    <path
      d={c.path}
      class="conn"
      fill="none"
      stroke={RING_BASE}
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
        stroke={isChamp ? GOLD : connectorColor(c)}
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
      <circle r="46" class="champion-ring" fill="none" stroke={CHAMP_SEAT} stroke-width="5" />
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
      <!-- Explicit fill presentation attribute (CSS still wins on-screen) so the
           ring stays transparent when rasterised; html-to-image otherwise drops
           the class-based fill and the SVG default black hides the flag. -->
      <circle
        r={n.r}
        class="ring"
        class:empty={!team}
        class:filled={team}
        fill={team ? 'none' : '#e9e5d8'}
        stroke={ringStroke(team, isChampSeat, isPicked, isChampionPick)}
        stroke-width={ringWidth(isChampSeat, isPicked, isChampionPick)}
      />
      {#if team && interactive}
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
