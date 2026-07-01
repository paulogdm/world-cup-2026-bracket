// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    // Per-history-entry state used for Back/Forward: `b` is the bracket picks
    // encoded via the querystring codec (absent only before the first sync).
    interface PageState {
      b?: string;
    }
  }
}

export {};
