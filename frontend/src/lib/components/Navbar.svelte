<script lang="ts">
  import { auth } from "../stores/auth.svelte.ts"
  import { navigate } from "../router.svelte.ts"

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
</script>

<header class="newspaper-header">
  <div class="header-top">
    <div class="volume-info">VOL. XXVI... NO. 065</div>
    <div class="user-status">
      {#if auth.isAuthenticated}
        <span>Masuk sebagai: <strong>{auth.user?.displayName || auth.user?.username}</strong> ({auth.user?.role})</span>
      {:else}
        <span>SUARA ASPIRASI AKADEMIK</span>
      {/if}
    </div>
  </div>

  <button class="masthead-btn" onclick={() => navigate("/")}>
    <h1 class="newspaper-title">SAMBAT UNTID</h1>
    <p class="newspaper-subtitle">"Suara Aspirasi dan Rant Demokrasi Mahasiswa Universitas Tidar"</p>
  </button>

  <div class="newspaper-meta">
    <span>Magelang, {currentDate}</span>
    <span>EDISI KHUSUS</span>
    <span>HARGA: ASPIRASI MAHASISWA</span>
  </div>

  <nav class="newspaper-nav">
    <button class="nav-link" onclick={() => navigate("/")}>
      <svg class="icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
      BERANDA
    </button>
    {#if auth.isAuthenticated}
      <button class="nav-link" onclick={() => navigate("/create")}>
        <svg class="icon" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        TULIS
      </button>
      <button class="nav-link" onclick={() => navigate("/profile")}>
        <svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        PROFIL
      </button>
      <button class="nav-link logout-btn" onclick={() => auth.logout()}>
        <svg class="icon" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        KELUAR
      </button>
    {:else}
      <button class="nav-link accent-link" onclick={() => navigate("/login")}>
        <svg class="icon" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
        MASUK / DAFTAR
      </button>
    {/if}
  </nav>
</header>

<style>
  .header-top {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
    border-bottom: var(--border-thin);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }
  .masthead-btn {
    display: block;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    text-align: center;
    transition: opacity var(--transition-fast);
  }
  .masthead-btn:hover {
    opacity: 0.85;
  }
  .newspaper-title {
    font-family: var(--font-serif);
    font-size: 3.5rem;
    font-weight: 700;
    letter-spacing: -1px;
    line-height: 1.1;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
    color: var(--text-primary);
  }
  .newspaper-subtitle {
    font-family: var(--font-serif);
    font-style: italic;
    color: var(--text-secondary);
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }
  .newspaper-nav {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1rem;
    border-top: var(--border-thin);
    border-bottom: var(--border-thin);
    padding: 0.5rem 0;
    flex-wrap: wrap;
  }
  .nav-link {
    background: none;
    border: none;
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 0.8rem;
    letter-spacing: 1px;
    color: var(--text-primary);
    cursor: pointer;
    text-transform: uppercase;
    position: relative;
    padding: 4px 2px;
    transition: color var(--transition-fast);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .nav-link:hover {
    color: var(--color-accent);
  }
  .nav-link::after {
    content: '';
    position: absolute;
    width: 0;
    height: 1px;
    bottom: 0;
    left: 0;
    background-color: var(--color-accent);
    transition: width var(--transition-fast);
  }
  .nav-link:hover::after {
    width: 100%;
  }
  .accent-link {
    color: var(--color-accent);
  }
  .logout-btn {
    color: #e74c3c;
  }
  .logout-btn:hover {
    color: #c0392b;
  }
  .logout-btn::after {
    background-color: #e74c3c;
  }
</style>
