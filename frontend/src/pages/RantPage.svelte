<script lang="ts">
  import { onMount } from "svelte"
  import { apiRequest } from "../lib/api/client"
  import { auth } from "../lib/stores/auth.svelte.ts"
  import { navigate } from "../lib/router.svelte.ts"
  import CategoryBadge from "../lib/components/CategoryBadge.svelte"
  import StatusBadge from "../lib/components/StatusBadge.svelte"
  import VoteButton from "../lib/components/VoteButton.svelte"
  import CommentThread from "../lib/components/CommentThread.svelte"

  let { id } = $props<{ id: string }>()

  let rant = $state<any>(null)
  let comments = $state<any[]>([])
  let myVote = $state<"up" | "down" | null>(null)

  let isLoading = $state(true)
  let errorMsg = $state("")

  let commentBody = $state("")
  let commentAnonymous = $state(false)
  let isSubmitting = $state(false)

  let adminStatus = $state("")

  async function loadData() {
    if (!id) return
    isLoading = true
    errorMsg = ""
    try {
      const [rantData, commentsData] = await Promise.all([
        apiRequest(`/api/rants/${id}`),
        apiRequest(`/api/interactions/comments/${id}`)
      ])
      rant = rantData
      adminStatus = rant.status
      comments = commentsData

      if (auth.isAuthenticated) {
        try {
          const voteRes = await apiRequest(`/api/interactions/votes/${id}/me`)
          myVote = voteRes.voteType
        } catch {
          myVote = null
        }
      }
    } catch (e: any) {
      errorMsg = e.message || "Gagal memuat aspirasi"
    } finally {
      isLoading = false
    }
  }

  async function refreshComments() {
    try {
      const [commentsData, updatedRant] = await Promise.all([
        apiRequest(`/api/interactions/comments/${id}`),
        apiRequest(`/api/rants/${id}`)
      ])
      comments = commentsData
      if (rant) rant.commentsCount = updatedRant.commentsCount
    } catch (e) {
      console.error("Gagal memuat ulang komentar:", e)
    }
  }

  $effect(() => {
    const _id = id
    if (_id) loadData()
  })

  async function handleAddComment() {
    if (!commentBody.trim()) return
    isSubmitting = true
    try {
      await apiRequest("/api/interactions/comments", {
        method: "POST",
        body: JSON.stringify({
          rantId: id,
          body: commentBody,
          isAnonymous: commentAnonymous
        })
      })
      commentBody = ""
      commentAnonymous = false
      await refreshComments()
    } catch (e: any) {
      errorMsg = e.message || "Gagal mengirim komentar"
    } finally {
      isSubmitting = false
    }
  }

  async function handleDeleteRant() {
    if (!confirm("Apakah Anda yakin ingin menghapus sambatan ini?")) return
    try {
      await apiRequest(`/api/rants/${id}`, { method: "DELETE" })
      navigate("/")
    } catch (e: any) {
      errorMsg = e.message || "Gagal menghapus sambat"
    }
  }

  async function handleStatusChange() {
    try {
      await apiRequest(`/api/rants/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: adminStatus })
      })
      if (rant) rant.status = adminStatus
    } catch (e: any) {
      errorMsg = e.message || "Gagal mengubah status"
      if (rant) adminStatus = rant.status
    }
  }

  const isAuthor = $derived(auth.isAuthenticated && rant && auth.user?.id === rant.userId)
  const canDelete = $derived(isAuthor || auth.isAdmin)
  const formattedDate = $derived(
    rant
      ? new Date(rant.createdAt).toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : ""
  )
</script>

<div class="rant-page fade-in">
  <button class="btn btn-secondary back-btn" onclick={() => navigate("/")}>
    <svg class="icon" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
    KEMBALI
  </button>

  {#if isLoading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Memuat rincian aspirasi…</p>
    </div>
  {:else if errorMsg && !rant}
    <div class="error-container">{errorMsg}</div>
  {:else if rant}
    <article class="newspaper-article">
      <div class="article-header">
        <div class="badge-row">
          <CategoryBadge category={rant.category} />
          <StatusBadge status={rant.status} />
        </div>

        <h1 class="article-title">{rant.title}</h1>

        <div class="article-meta">
          {#if rant.isAnonymous}
            <span class="author anonymous">
              <svg class="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Laporan: <strong>{rant.author?.displayName || "Anonim"}</strong>
            </span>
          {:else}
            <span class="author">
              <svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Penulis: <strong>{rant.author?.displayName || rant.author?.username}</strong>
            </span>
          {/if}
          <span class="date">{formattedDate}</span>

          {#if rant.isAnonymous && auth.isAdmin && rant.author?._adminUsername}
            <span class="admin-trace">[Admin: {rant.author?._adminUsername}]</span>
          {/if}
        </div>
      </div>

      <div class="article-body-wrapper">
        {#if auth.isAuthenticated}
          <VoteButton
            rantId={rant.id}
            bind:upvotes={rant.upvotesCount}
            bind:downvotes={rant.downvotesCount}
            initialVote={myVote}
          />
        {:else}
          <button class="vote-locked" onclick={() => navigate("/login")}>
            <svg class="icon lock-icon-svg" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span class="score-display">{rant.upvotesCount - rant.downvotesCount} suara</span>
            <span class="lock-text">Masuk untuk memilih</span>
          </button>
        {/if}

        <div class="article-content">
          {rant.body}
        </div>
      </div>

      {#if errorMsg}
        <div class="inline-error">{errorMsg}</div>
      {/if}

      {#if canDelete || auth.isAdmin}
        <div class="admin-panel">
          <h3>Panel Kontrol</h3>
          <div class="admin-actions">
            {#if auth.isAdmin}
              <div class="status-updater">
                <label for="status-select">Status:</label>
                <select id="status-select" bind:value={adminStatus} onchange={handleStatusChange} class="form-control status-select">
                  <option value="open">TERBUKA</option>
                  <option value="acknowledged">DITERIMA</option>
                  <option value="resolved">SELESAI</option>
                  <option value="closed">ARSIP</option>
                </select>
              </div>
            {/if}

            {#if canDelete}
              <button class="btn btn-danger" onclick={handleDeleteRant}>
                <svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                Hapus
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </article>

    <!-- Comments Section -->
    <section class="comments-section">
      <h2 class="section-title">
        <svg class="icon" viewBox="0 0 24 24" style="margin-right: 0.5rem;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Diskusi ({rant.commentsCount})
      </h2>

      {#if auth.isAuthenticated}
        <div class="add-comment-box">
          <label for="comment-textarea" class="form-label">Tulis Tanggapan</label>
          <textarea
            id="comment-textarea"
            class="form-control"
            placeholder="Ketik tanggapan atau saran Anda..."
            bind:value={commentBody}
            rows="3"
          ></textarea>

          <div class="comment-box-footer">
            <label class="anon-toggle">
              <input type="checkbox" bind:checked={commentAnonymous} />
              <svg class="icon" viewBox="0 0 24 24" style="width: 1em; height: 1em; stroke: var(--color-accent);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Anonim
            </label>

            <button class="btn btn-primary" disabled={isSubmitting || !commentBody.trim()} onclick={handleAddComment}>
              {isSubmitting ? "Mengirim…" : "Kirim"}
            </button>
          </div>
        </div>
      {:else}
        <button class="comment-locked-btn" onclick={() => navigate("/login")}>
          <svg class="icon" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Masuk untuk ikut berdiskusi
        </button>
      {/if}

      {#if comments.length === 0}
        <div class="empty-comments">Belum ada tanggapan. Jadilah yang pertama!</div>
      {:else}
        <div class="comments-tree">
          {#each comments as comment (comment.id)}
            <CommentThread {comment} depth={0} onRefresh={refreshComments} />
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .back-btn {
    margin-bottom: 1.5rem;
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
  .error-container {
    text-align: center;
    padding: 3rem;
    font-family: var(--font-serif);
    font-size: 1.2rem;
    color: #e74c3c;
    border: 1px solid #e74c3c;
    background-color: var(--bg-secondary);
  }
  .inline-error {
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid #e74c3c;
    color: #e74c3c;
    padding: 0.8rem;
    border-radius: 4px;
    margin-top: 1rem;
    font-size: 0.85rem;
    text-align: center;
  }
  .newspaper-article {
    border: var(--border-thin);
    background-color: var(--bg-secondary);
    padding: 2rem;
    margin-bottom: 2rem;
  }
  .article-header {
    border-bottom: var(--border-thick);
    padding-bottom: 1.5rem;
    margin-bottom: 2rem;
  }
  .badge-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1rem;
  }
  .article-title {
    font-family: var(--font-serif);
    font-size: 2.2rem;
    font-weight: 700;
    line-height: 1.2;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }
  .article-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.5rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
  }
  .author {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .author strong {
    color: var(--text-primary);
  }
  .author.anonymous strong {
    color: var(--color-accent);
  }
  .admin-trace {
    color: #e74c3c;
    font-weight: bold;
  }
  .article-body-wrapper {
    display: flex;
    align-items: flex-start;
    margin-bottom: 2rem;
  }
  .vote-locked {
    all: unset;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-right: var(--border-thin);
    padding-right: 1rem;
    margin-right: 1rem;
    min-width: 70px;
    text-align: center;
    cursor: pointer;
    transition: color var(--transition-fast);
  }
  .vote-locked:hover {
    color: var(--color-accent);
  }
  .lock-icon-svg {
    margin-bottom: 0.2rem;
  }
  .score-display {
    font-family: var(--font-serif);
    font-weight: 700;
    font-size: 1.1rem;
  }
  .lock-text {
    font-size: 0.65rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    margin-top: 0.2rem;
  }
  .article-content {
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    flex-grow: 1;
  }
  .admin-panel {
    border-top: var(--border-thick);
    padding-top: 1.5rem;
    margin-top: 2rem;
  }
  .admin-panel h3 {
    font-family: var(--font-serif);
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--color-accent);
    text-transform: uppercase;
  }
  .admin-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  .status-updater {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .status-updater label {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
  .status-select {
    width: auto;
    background-color: var(--bg-tertiary);
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .comments-section {
    border: var(--border-thin);
    background-color: var(--bg-secondary);
    padding: 2rem;
  }
  .section-title {
    font-family: var(--font-serif);
    font-size: 1.4rem;
    font-weight: 700;
    border-bottom: var(--border-thin);
    padding-bottom: 0.75rem;
    margin-bottom: 1.5rem;
    text-transform: uppercase;
    display: flex;
    align-items: center;
  }
  .add-comment-box {
    background-color: var(--bg-tertiary);
    border: var(--border-thin);
    padding: 1.2rem;
    border-radius: 4px;
    margin-bottom: 2rem;
  }
  .comment-box-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.8rem;
  }
  .anon-toggle {
    font-size: 0.85rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }
  .anon-toggle:hover {
    color: var(--text-primary);
  }
  .comment-locked-btn {
    all: unset;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    text-align: center;
    background-color: var(--bg-tertiary);
    border: 1px dashed var(--border-color);
    padding: 1.5rem;
    font-size: 0.9rem;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 2rem;
    transition: color var(--transition-fast), border-color var(--transition-fast);
    box-sizing: border-box;
  }
  .comment-locked-btn:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }
  .empty-comments {
    text-align: center;
    font-family: var(--font-serif);
    padding: 2rem;
    color: var(--text-secondary);
    font-style: italic;
  }
  .comments-tree {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
