<script lang="ts">
  import { onMount } from "svelte"
  import Navbar from "./lib/components/Navbar.svelte"
  import { routeState, initRouter } from "./lib/router.svelte.ts"
  
  import Home from "./pages/Home.svelte"
  import RantPage from "./pages/RantPage.svelte"
  import CreateRant from "./pages/CreateRant.svelte"
  import Login from "./pages/Login.svelte"
  import Profile from "./pages/Profile.svelte"

  const routes = {
    "/": Home,
    "/login": Login,
    "/create": CreateRant,
    "/profile": Profile,
    "/rant/:id": RantPage
  }

  let cleanup = () => {}

  onMount(() => {
    cleanup = initRouter(routes)
    return () => cleanup()
  })

  // We assign to a capitalized reactive variable to ensure it renders as a component
  const Component = $derived(routeState.component);
</script>

<Navbar />

<main class="app-container">
  {#if Component}
    <Component {...routeState.params} />
  {:else}
    <div style="text-align: center; padding: 3rem; font-family: var(--font-serif);">
      <h2>Memuat Halaman...</h2>
    </div>
  {/if}
</main>

<footer class="newspaper-footer">
  <div class="footer-content">
    <p>© 2026 SAMBAT UNTID — PERS ASPIRASI INDEPENDEN MAHASISWA</p>
    <p class="footer-moto">"Fiat justitia ruat caelum — Hendaklah keadilan ditegakkan walaupun langit runtuh"</p>
  </div>
</footer>

<style>
  .newspaper-footer {
    border-top: var(--border-thick);
    padding: 2rem 0;
    margin-top: 4rem;
    text-align: center;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
  .footer-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
  }
  .footer-moto {
    font-family: var(--font-serif);
    font-style: italic;
    text-transform: none;
    color: var(--text-tertiary);
  }
</style>
