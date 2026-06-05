<script lang="ts">
  import { apiRequest } from "../lib/api/client"
  import RantCard from "../lib/components/RantCard.svelte"
  import { auth } from "../lib/stores/auth.svelte.ts"
  import { navigate } from "../lib/router.svelte.ts"

  let rants = $state<any[]>([])
  let isLoading = $state(true)
  let errorMsg = $state("")

  let category = $state("")
  let status = $state("")
  let sort = $state("hot")
  let page = $state(1)
  let hasMore = $state(true)

  async function loadRants() {
    isLoading = true
    errorMsg = ""
    try {
      const queryParams = new URLSearchParams()
      if (category) queryParams.set("category", category)
      if (status) queryParams.set("status", status)
      if (sort) queryParams.set("sort", sort)
      queryParams.set("page", page.toString())
      queryParams.set("limit", "12")

      const res = await apiRequest(`/api/rants?${queryParams.toString()}`)
      rants = res.data || []
      hasMore = rants.length === 12
    } catch (e: any) {
      errorMsg = e.message || "Gagal memuat lembaran aspirasi"
    } finally {
      isLoading = false
    }
  }

  $effect(() => {
    const _cat = category
    const _stat = status
    const _sort = sort
    const _page = page
    loadRants()
  })

  function handleFilterChange(type: "category" | "status" | "sort", val: string) {
    page = 1
    if (type === "category") category = val
    if (type === "status") status = val
    if (type === "sort") sort = val
  }
</script>

<div class="homepage fade-in">
  <div class="filter-headline">
    <h2>LEMBARAN SAMBAT & ASPIRASI</h2>
    <div class="actions">
      {#if auth.isAuthenticated}
        <button class="btn btn-primary" onclick={() => navigate("/create")}>
          <svg class="icon" viewBox="0 0 24 24" style="margin-right: 0.3rem;"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Sambat Baru
        </button>
      {/if}
    </div>
  </div>

  <div class="newspaper-layout">
    <main class="main-content">
      {#if isLoading}
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Memuat berkas aspirasi…</p>
        </div>
      {:else if errorMsg}
        <div class="error-container">{errorMsg}</div>
      {:else if rants.length === 0}
        <div class="empty">
          <svg class="icon" viewBox="0 0 24 24" style="width: 2rem; height: 2rem; margin-bottom: 0.5rem; stroke: var(--text-tertiary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          <p>Belum ada sambatan di lembaran ini.</p>
        </div>
      {:else}
        <div class="rants-grid">
          {#each rants as rant (rant.id)}
            <div class="grid-item">
              <RantCard {rant} />
            </div>
          {/each}
        </div>

        <div class="pagination">
          <button class="btn btn-secondary" disabled={page === 1} onclick={() => page--}>
            <svg class="icon" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Sebelumnya
          </button>
          <span class="page-info">Hal. {page}</span>
          <button class="btn btn-secondary" disabled={!hasMore} onclick={() => page++}>
            Selanjutnya
            <svg class="icon" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      {/if}
    </main>

    <aside class="sidebar">
      <div class="sidebar-box">
        <h3>URUTKAN</h3>
        <div class="filter-list">
          <button class="filter-btn" class:active={sort === "hot"} onclick={() => handleFilterChange("sort", "hot")}>
            <svg class="icon" viewBox="0 0 24 24" style="stroke: #e74c3c;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            Terhangat
          </button>
          <button class="filter-btn" class:active={sort === "new"} onclick={() => handleFilterChange("sort", "new")}>
            <svg class="icon" viewBox="0 0 24 24" style="stroke: #3498db;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Terbaru
          </button>
          <button class="filter-btn" class:active={sort === "top"} onclick={() => handleFilterChange("sort", "top")}>
            <svg class="icon" viewBox="0 0 24 24" style="stroke: #2ca01c;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            Teratas
          </button>
        </div>
      </div>

      <div class="sidebar-box">
        <h3>KATEGORI</h3>
        <div class="filter-list">
          <button class="filter-btn" class:active={category === ""} onclick={() => handleFilterChange("category", "")}>Semua</button>
          <button class="filter-btn" class:active={category === "akademik"} onclick={() => handleFilterChange("category", "akademik")}>Akademik</button>
          <button class="filter-btn" class:active={category === "fasilitas"} onclick={() => handleFilterChange("category", "fasilitas")}>Fasilitas</button>
          <button class="filter-btn" class:active={category === "dosen"} onclick={() => handleFilterChange("category", "dosen")}>Dosen</button>
          <button class="filter-btn" class:active={category === "organisasi"} onclick={() => handleFilterChange("category", "organisasi")}>Organisasi</button>
          <button class="filter-btn" class:active={category === "lainnya"} onclick={() => handleFilterChange("category", "lainnya")}>Lain-lain</button>
        </div>
      </div>

      <div class="sidebar-box">
        <h3>STATUS</h3>
        <div class="filter-list">
          <button class="filter-btn" class:active={status === ""} onclick={() => handleFilterChange("status", "")}>Semua</button>
          <button class="filter-btn" class:active={status === "open"} onclick={() => handleFilterChange("status", "open")}>Terbuka</button>
          <button class="filter-btn" class:active={status === "acknowledged"} onclick={() => handleFilterChange("status", "acknowledged")}>Diterima</button>
          <button class="filter-btn" class:active={status === "resolved"} onclick={() => handleFilterChange("status", "resolved")}>Selesai</button>
          <button class="filter-btn" class:active={status === "closed"} onclick={() => handleFilterChange("status", "closed")}>Arsip</button>
        </div>
      </div>

      <div class="sidebar-box info-box">
        <h3>MAKLUMAT REDAKSI</h3>
        <p>1. Sambat secara demokratis demi kemajuan prodi.</p>
        <p>2. Aktifkan opsi <strong>Anonim</strong> untuk menjaga privasi Anda.</p>
        <p>3. Dapatkan <strong>10 suara bersih</strong> untuk eskalasi otomatis.</p>
      </div>
    </aside>
  </div>
</div>

<style>
  .filter-headline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: var(--border-thick);
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
  }
  .filter-headline h2 {
    font-family: var(--font-serif);
    font-size: 1.5rem;
    letter-spacing: -0.5px;
    font-weight: 700;
  }
  .newspaper-layout {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 2rem;
  }
  @media (max-width: 900px) {
    .newspaper-layout {
      grid-template-columns: 1fr;
    }
  }
  .rants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
    border: var(--border-thin);
    background-color: var(--bg-secondary);
  }
  .loading-state p {
    font-family: var(--font-serif);
    font-size: 1rem;
    color: var(--text-secondary);
    font-style: italic;
  }
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4rem 2rem;
    font-family: var(--font-serif);
    font-size: 1.1rem;
    color: var(--text-secondary);
    border: var(--border-thin);
    background-color: var(--bg-secondary);
  }
  .error-container {
    text-align: center;
    padding: 3rem;
    font-family: var(--font-serif);
    font-size: 1.2rem;
    color: #e74c3c;
    border: 1px solid #e74c3c;
    background-color: var(--bg-secondary);
  }
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    margin-top: 2rem;
    border-top: var(--border-thin);
    padding-top: 1.5rem;
  }
  .page-info {
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .sidebar-box {
    border: var(--border-thin);
    background-color: var(--bg-secondary);
    padding: 1.2rem;
  }
  .sidebar-box h3 {
    font-family: var(--font-serif);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 0.75rem;
    border-bottom: var(--border-thin);
    padding-bottom: 0.4rem;
    text-transform: uppercase;
    color: var(--color-accent);
  }
  .filter-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .filter-btn {
    background: none;
    border: none;
    font-family: var(--font-sans);
    color: var(--text-secondary);
    text-align: left;
    padding: 0.4rem 0.6rem;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    transition: all var(--transition-fast);
    border-left: 2px solid transparent;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .filter-btn:hover {
    color: var(--text-primary);
    border-left-color: var(--text-secondary);
    background-color: var(--bg-tertiary);
  }
  .filter-btn.active {
    color: var(--text-primary);
    border-left-color: var(--color-accent);
    font-weight: 700;
    background-color: var(--bg-tertiary);
  }
  .info-box p {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }
  .info-box p strong {
    color: var(--text-primary);
  }
</style>
