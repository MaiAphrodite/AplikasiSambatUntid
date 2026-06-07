<script lang="ts">
  import { navigate } from "../router.svelte.ts"
  import CategoryBadge from "./CategoryBadge.svelte"
  import StatusBadge from "./StatusBadge.svelte"

  let { rant } = $props<{ rant: any }>()

  const formattedDate = $derived(new Date(rant.createdAt).toLocaleDateString("id-ID", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }))

  function openRant() {
    navigate(`/rant/${rant.id}`)
  }
</script>

<article class="rant-card fade-in">
  <div class="card-header">
    <CategoryBadge category={rant.category} />
    <StatusBadge status={rant.status} />
  </div>

  <button class="rant-title-btn" onclick={openRant}>
    {rant.title}
  </button>

  <div class="rant-meta">
    {#if rant.isAnonymous}
      <span class="author anonymous">
        <svg class="icon" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        {rant.author?.displayName || "Anonim"}
      </span>
    {:else}
      <span class="author">
        <svg class="icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        {rant.author?.displayName || rant.author?.username || "Anonim"}
      </span>
    {/if}
    <span class="dot">·</span>
    <span class="date">{formattedDate}</span>
  </div>

  {#if rant.imageUrl}
    <button class="rant-thumbnail-btn" onclick={openRant}>
      <img src={rant.imageUrl} alt="Thumbnail" class="rant-thumbnail" loading="lazy" />
    </button>
  {/if}

  <p class="rant-snippet">
    {rant.body.length > 180 ? rant.body.substring(0, 180) + '…' : rant.body}
  </p>

  <div class="card-footer">
    <span class="votes-score">
      <svg class="icon" viewBox="0 0 24 24" style="width: 1em; height: 1em;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
      <strong>{rant.upvotesCount - rant.downvotesCount}</strong> suara
    </span>
    <button class="comments-btn" onclick={openRant}>
      <svg class="icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      {rant.commentsCount} KOMENTAR
    </button>
  </div>
</article>

<style>
  .rant-card {
    border: var(--border-thin);
    background-color: var(--bg-secondary);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    height: 100%;
    transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
  }
  .rant-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-accent);
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .rant-title-btn {
    all: unset;
    font-family: var(--font-serif);
    font-size: 1.3rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--text-primary);
    cursor: pointer;
    margin-bottom: 0.75rem;
    transition: color var(--transition-fast);
    text-align: left;
    display: block;
    width: 100%;
  }
  .rant-title-btn:hover {
    color: var(--color-accent);
  }
  .rant-meta {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.5rem;
  }
  .author {
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }
  .author.anonymous {
    color: var(--color-accent);
  }
  .dot {
    margin: 0 0.5rem;
    color: var(--text-tertiary);
  }
  .rant-snippet {
    font-size: 0.95rem;
    color: var(--text-primary);
    flex-grow: 1;
    margin-bottom: 1.5rem;
    opacity: 0.9;
    word-break: break-word;
    line-height: 1.5;
  }
  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: var(--border-thin);
    padding-top: 1rem;
    font-size: 0.8rem;
    letter-spacing: 1px;
  }
  .votes-score {
    text-transform: uppercase;
    color: var(--text-secondary);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .votes-score strong {
    color: var(--text-primary);
  }
  .comments-btn {
    all: unset;
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--color-accent);
    cursor: pointer;
    text-transform: uppercase;
    transition: color var(--transition-fast);
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .comments-btn:hover {
    color: var(--color-accent-hover);
  }
  .rant-thumbnail-btn {
    all: unset;
    cursor: pointer;
    margin-bottom: 1rem;
    display: block;
    width: 100%;
    border: var(--border-thin);
    background-color: var(--bg-tertiary);
    padding: 0.25rem;
  }
  .rant-thumbnail {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }
</style>
