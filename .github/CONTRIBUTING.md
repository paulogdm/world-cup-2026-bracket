# Contributing

Thanks for wanting to hack on the World Cup 2026 bracket! This is a small,
vibecoded project and contributions of all kinds are welcome — including
AI-generated ones (see [LICENSE](../LICENSE)). No need to disclose whether a
human or a model wrote your patch; just make it work.

## Getting started

```sh
pnpm install
pnpm dev      # start the dev server
```

## Before you open a PR

Run the same checks CI runs:

```sh
pnpm check    # svelte-check / type-checking
pnpm test     # vitest unit tests
pnpm build    # production build
```

CI (`.github/workflows/ci.yml`) runs all three on every pull request.

## Guidelines

- Keep changes focused — one logical change per PR.
- Match the surrounding code style.
- If you add behavior, add or update a test under `src/lib/**`.
- Be kind in reviews and discussions.

Then push your branch and open a PR. The footer's "Create a PR" link points
here too. 🏆
