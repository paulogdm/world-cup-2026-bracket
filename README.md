# 🏆 World Cup 2026 — Interactive Bracket

An interactive, shareable version of the radial **World Cup 2026** knockout
poster. Click a flag to advance it through the rounds; the whole bracket is
encoded in the URL, so your predictions are one copy-paste away from a friend.

> _Vibecoded_ — built with Claude and Codex, one slop at a time.

<!-- Drop a screenshot/GIF here once you have one: -->
<!-- ![screenshot](docs/screenshot.png) -->

## Features

- **Radial bracket** — 32 teams arranged in a circle that collapses inward to
  the centre trophy, faithful to the original poster.
- **Click to advance** — click either flag in a match to send it to the next
  round. You can advance a team even before its eventual opponent is decided.
- **Smart re-picking** — change an earlier result and only the picks that
  actually depended on the old winner are cleared; unrelated branches stay put.
  Cleared nodes flash briefly so you can see what changed.
- **The whole bracket lives in the URL** — every pick is packed into a compact
  `?b=...` query parameter and written with `history.replaceState` (no history
  spam). Copy the link, share the bracket.
- **Champion, writ large** — decide the final and the winner takes centre stage
  as an oversized, gold-ringed flag where the trophy stood.
- **Real-results mode** — a config file lets you seed the default bracket with
  actual outcomes as the tournament unfolds.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5 runes)
- [`@sveltejs/adapter-vercel`](https://svelte.dev/docs/kit/adapter-vercel) — deploy-ready for Vercel
- [`flag-icons`](https://github.com/lipis/flag-icons) for crisp, uniform circular flags
- [pnpm](https://pnpm.io/)

## Getting started

```bash
pnpm install
pnpm dev        # dev server at http://localhost:5180
pnpm build      # production build (Vercel adapter)
pnpm preview    # preview the production build locally
```

## How it works

- **State encoding** — there are 31 matches. Each is a base-3 digit
  (`0` undecided · `1` top won · `2` bottom won), packed little-endian into a
  `BigInt` and serialised as base-36. That's the `?b=...` value; an empty
  bracket has no parameter at all.
- **Advancing & clearing** — `applyPick` records the winning side of a match.
  When you change an existing pick, `dependentAncestors` walks up the tree only
  as far as the results that genuinely consumed the old winner, so sibling
  branches are never touched.
- **Static & shareable** — the page is prerendered; all state is client-side in
  the URL, so it deploys anywhere as a static SPA.

## Setting real results (the default bracket)

Open the app **without** a `?b=...` link and it starts from the real-world
results recorded in [`src/lib/bracket/config.ts`](src/lib/bracket/config.ts).
As matches are played, fill in winners there (by match id and flag code) and
redeploy — the default view keeps pace with the actual tournament. The
**Real results** button also resets any in-progress bracket back to that state.

```ts
// src/lib/bracket/config.ts
export const defaultResults: Record<string, TeamId> = {
  'R32-09': 'br', // Brazil beat Japan
  // 'R32-12': 'gb-eng', // England vs DR Congo
  // ...fill in as the tournament progresses
};
```

## Project layout

| File | Purpose |
|------|---------|
| [`src/lib/bracket/config.ts`](src/lib/bracket/config.ts) | **Edit me** — title + real-world results (default state) |
| [`src/lib/bracket/teams.ts`](src/lib/bracket/teams.ts) | The 32 teams and the Round-of-32 seeding from the poster |
| [`src/lib/bracket/structure.ts`](src/lib/bracket/structure.ts) | Builds the knockout tree + radial geometry |
| [`src/lib/bracket/state.ts`](src/lib/bracket/state.ts) | Pick rules, querystring codec, result resolution |
| [`src/routes/+page.svelte`](src/routes/+page.svelte) | The bracket UI |

## Caveats

- The matchups come from the illustrative poster, not the official draw.
- Flag codes are ISO 3166-1 alpha-2 (lowercase), with England as the `gb-eng`
  subdivision — see `teams.ts`.

