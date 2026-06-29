<script lang="ts">
  // Root layout: loads the shared theme (fonts + light/dark palette tokens) so
  // every route inherits it, then renders the active page. State still lives in
  // the URL — see +layout.ts for the prerender/SSR config.
  import '$lib/styles/theme.css';

  let { children } = $props();
</script>

{@render children()}
