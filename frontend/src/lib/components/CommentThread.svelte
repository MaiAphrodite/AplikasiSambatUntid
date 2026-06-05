<script lang="ts">
  import { auth } from "../stores/auth.svelte.ts"
  import { apiRequest } from "../api/client"
  import { navigate } from "../router.svelte.ts"
  import CommentThread from "./CommentThread.svelte"

  let {
    comment,
    depth = 0,
    onRefresh = () => {}
  } = $props<{
    comment: any
    depth?: number
    onRefresh?: () => void
  }>()

  let showReplyForm = $state(false)
  let replyBody = $state("")
  let replyAnonymous = $state(false)
  let isSubmitting = $state(false)
  let errorMsg = $state("")
  let isCollapsed = $state(false)

  const formattedDate = $derived(new Date(comment.createdAt).toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }))

  function autoFocus(node: HTMLElement) {
    setTimeout(() => node.focus(), 50)
  }

  async function handleReply() {
    if (!auth.isAuthenticated) {
      navigate("/login")
      return
    }
    if (!replyBody.trim()) return

    isSubmitting = true
    errorMsg = ""

    try {
      await apiRequest("/api/interactions/comments", {
        method: "POST",
        body: JSON.stringify({
          rantId: comment.rantId,
          body: replyBody,
          isAnonymous: replyAnonymous,
          parentId: comment.id
        })
      })
      replyBody = ""
      replyAnonymous = false
      showReplyForm = false
      onRefresh()
    } catch (e: any) {
      errorMsg = e.message || "Gagal membalas komentar"
    } finally {
      isSubmitting = false
    }
  }

  async function handleDelete() {
    if (!confirm("Apakah Anda yakin ingin menghapus komentar ini?")) return

    try {
      await apiRequest(`/api/interactions/comments/${comment.id}`, {
        method: "DELETE"
      })
      onRefresh()
    } catch (e: any) {
      errorMsg = e.message || "Gagal menghapus komentar"
    }
  }

  const isAuthor = $derived(auth.isAuthenticated && auth.user?.id === comment.userId)
  const canDelete = $derived(isAuthor || auth.isAdmin)

  // Cap effective depth to prevent UI clipping on deeply nested recursive threads
  // Only apply margins if depth is 3 or less. After that, threads render flat.
  const MAX_INDENT = 3;
  const shouldIndent = $derived(depth > 0 && depth <= MAX_INDENT);
  const marginLeft = $derived(shouldIndent ? 1.2 : 0);
  const paddingLeft = $derived(shouldIndent ? 0.8 : 0);
</script>

<div class="comment-node" style="margin-left: {marginLeft}rem; border-left: {shouldIndent ? '1px solid var(--border-color)' : 'none'}; padding-left: {paddingLeft}rem;">
  <div class="comment-card" class:collapsed={isCollapsed}>
    <div class="comment-meta">
      <button class="collapse-toggle" onclick={() => isCollapsed = !isCollapsed} aria-label={isCollapsed ? "Expand thread" : "Collapse thread"} title={isCollapsed ? "Buka utas" : "Tutup utas"}>
        {#if isCollapsed}
          <svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        {:else}
          <svg class="icon" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        {/if}
      </button>

      {#if comment.isAnonymous}
        <span class="author anonymous">
          <svg class="icon" viewBox="0 0 24 24" style="width: 0.9em; height: 0.9em; stroke: var(--color-accent);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          {comment.author?.displayName || "Anonim"}
        </span>
      {:else}
        <span class="author">
          <svg class="icon" viewBox="0 0 24 24" style="width: 0.9em; height: 0.9em;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {comment.author?.displayName || comment.author?.username}
        </span>
      {/if}
      <span class="date">{formattedDate}</span>

      {#if comment.isAnonymous && auth.isAdmin && comment.author?._adminUsername}
        <span class="admin-trace">[Admin: {comment.author?._adminUsername}]</span>
      {/if}

      {#if isCollapsed && comment.replies?.length > 0}
        <span class="collapsed-badge">+{comment.replies.length} balasan</span>
      {/if}
    </div>

    {#if !isCollapsed}
      <div class="comment-body fade-in">
        {comment.body}
      </div>

      <div class="comment-actions">
        {#if auth.isAuthenticated}
          <button class="action-btn" onclick={() => showReplyForm = !showReplyForm}>
            <svg class="icon" viewBox="0 0 24 24" style="width: 0.85em; height: 0.85em;"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
            Balas
          </button>
        {/if}

        {#if canDelete}
          <button class="action-btn delete-btn" onclick={handleDelete}>
            <svg class="icon" viewBox="0 0 24 24" style="width: 0.85em; height: 0.85em;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Hapus
          </button>
        {/if}
      </div>

      {#if errorMsg}
        <p class="error-text">{errorMsg}</p>
      {/if}

      {#if showReplyForm}
        <div class="reply-form fade-in">
          <textarea
            class="form-control"
            placeholder="Tulis balasan Anda..."
            bind:value={replyBody}
            use:autoFocus
            rows="2"
          ></textarea>

          <div class="reply-form-actions">
            <label class="anon-toggle-label">
              <input type="checkbox" bind:checked={replyAnonymous} />
              <svg class="icon" viewBox="0 0 24 24" style="stroke: var(--color-accent); width: 0.9em; height: 0.9em;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Anonim
            </label>

            <div class="buttons">
              <button class="btn btn-secondary" onclick={() => showReplyForm = false}>Batal</button>
              <button class="btn btn-primary" disabled={isSubmitting || !replyBody.trim()} onclick={handleReply}>
                {isSubmitting ? "Mengirim…" : "Kirim"}
              </button>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  {#if !isCollapsed && comment.replies && comment.replies.length > 0}
    <div class="replies-list">
      {#each comment.replies as reply (reply.id)}
        <CommentThread comment={reply} depth={depth + 1} {onRefresh} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .comment-node {
    margin-top: 0.8rem;
  }
  .comment-card {
    background-color: var(--bg-tertiary);
    border: var(--border-thin);
    padding: 0.8rem 1rem;
    border-radius: 4px;
    transition: opacity var(--transition-fast);
  }
  .comment-card.collapsed {
    padding: 0.5rem 1rem;
    opacity: 0.8;
  }
  .comment-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
  }
  .collapse-toggle {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    cursor: pointer;
    transition: all var(--transition-fast);
    padding: 0;
  }
  .collapse-toggle .icon {
    width: 0.75em;
    height: 0.75em;
  }
  .collapse-toggle:hover {
    color: var(--text-primary);
    border-color: var(--text-primary);
    background-color: var(--bg-secondary);
  }
  .collapsed-badge {
    font-size: 0.65rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    padding: 0.1rem 0.4rem;
    border-radius: 10px;
    color: var(--text-tertiary);
  }
  .author {
    font-weight: 600;
    color: var(--text-primary);
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
  }
  .author.anonymous {
    color: var(--color-accent);
  }
  .admin-trace {
    color: #e74c3c;
    font-weight: bold;
    font-size: 0.7rem;
  }
  .comment-body {
    font-size: 0.95rem;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.5;
    margin-top: 0.4rem;
  }
  .comment-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 0.5rem;
    border-top: 1px dashed var(--border-color);
    padding-top: 0.4rem;
  }
  .action-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 0.75rem;
    cursor: pointer;
    text-transform: uppercase;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    transition: color var(--transition-fast);
  }
  .action-btn:hover {
    color: var(--text-primary);
  }
  .delete-btn:hover {
    color: #e74c3c;
  }
  .reply-form {
    margin-top: 0.8rem;
    background-color: var(--bg-secondary);
    padding: 0.8rem;
    border: var(--border-thin);
    border-radius: 4px;
  }
  .reply-form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .anon-toggle-label {
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--text-secondary);
  }
  .anon-toggle-label:hover {
    color: var(--text-primary);
  }
  .buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .error-text {
    color: #e74c3c;
    font-size: 0.8rem;
    margin-top: 0.5rem;
  }
  .replies-list {
    margin-top: 0.4rem;
  }
</style>
