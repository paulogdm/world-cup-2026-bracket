<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  import { LOCALE_META } from '$lib/i18n/locales';
  import { STRINGS } from '$lib/i18n/strings';
  import { i18n, initLocale } from '$lib/i18n/store.svelte';
  import { initTheme } from '$lib/theme/store.svelte';

  // Current UI strings, reactive to the selected locale.
  const t = $derived(STRINGS[i18n.locale]);

  // 404 gets bespoke "off the pitch" copy; any other status falls back to a
  // generic message. The status number is always shown verbatim.
  const isNotFound = $derived(page.status === 404);
  const title = $derived(isNotFound ? t.notFoundTitle : t.errorTitle);
  const body = $derived(isNotFound ? t.notFoundBody : t.errorBody);

  const TROPHY_IMAGE_URL = '/world-cup-trophy.svg';

  // Match the home page: resolve the stored locale/theme on the client (SSR
  // renders the English default), then keep <html lang> in sync.
  onMount(() => {
    initLocale();
    initTheme();
  });
  $effect(() => {
    document.documentElement.lang = LOCALE_META[i18n.locale].htmlLang;
  });
</script>

<svelte:head>
  <title>{page.status} — {t.wordmark} 2026</title>
</svelte:head>

<main>
  <section class="card">
    <img class="trophy" src={TROPHY_IMAGE_URL} alt="" aria-hidden="true" />

    <p class="eyebrow">{t.errorKicker} {page.status}</p>
    <p class="code" aria-hidden="true">{page.status}</p>
    <h1 class="title">{title}</h1>
    <p class="body">{body}</p>

    <a class="btn btn--go" href="/">{t.backHome}</a>
  </section>
</main>

<style>
  main {
    min-height: 100svh;
    display: grid;
    place-items: center;
    padding: 2rem 1rem 3rem;
    box-sizing: border-box;
  }

  .card {
    position: relative;
    max-width: 30rem;
    text-align: center;
  }
  .card > *:not(.trophy) {
    position: relative;
    z-index: 1;
    animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
  }
  .card > *:nth-child(3) {
    animation-delay: 0.05s;
  }
  .card > *:nth-child(4) {
    animation-delay: 0.1s;
  }
  .card > *:nth-child(5) {
    animation-delay: 0.15s;
  }
  .card > *:nth-child(6) {
    animation-delay: 0.2s;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }

  /* Faint trophy watermark behind the message — a branded backdrop. */
  .trophy {
    position: absolute;
    top: 50%;
    left: 50%;
    width: clamp(13rem, 42vw, 19rem);
    transform: translate(-50%, -54%);
    opacity: 0.06;
    pointer-events: none;
    z-index: 0;
  }

  .eyebrow {
    margin: 0 0 0.6rem;
    font-family: var(--mono);
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .code {
    margin: 0;
    font-family: var(--display);
    font-weight: 900;
    font-stretch: 125%;
    line-height: 0.86;
    font-size: clamp(4.5rem, 22vw, 8.5rem);
    color: var(--gold);
    letter-spacing: 0.01em;
  }

  .title {
    margin: 0.4rem 0 0;
    font-family: var(--display);
    font-weight: 900;
    font-stretch: 125%;
    text-transform: uppercase;
    font-size: clamp(1.5rem, 6vw, 2.4rem);
    line-height: 0.95;
    color: var(--ink);
  }

  .body {
    margin: 0.85rem auto 0;
    max-width: 26rem;
    font-size: 0.98rem;
    line-height: 1.55;
    color: var(--muted);
  }

  .btn {
    display: inline-block;
    margin-top: clamp(1.3rem, 3vw, 1.9rem);
    font-family: var(--mono);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
    padding: 0.62rem 1.2rem;
    border-radius: 999px;
    cursor: pointer;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      transform 0.05s ease;
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
  .btn:active {
    transform: translateY(1px);
  }
  .btn:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .card > *:not(.trophy) {
      animation: none;
    }
  }
</style>
