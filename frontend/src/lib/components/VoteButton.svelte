<script lang="ts">
  import { auth } from "../stores/auth.svelte.ts"
  import { apiRequest } from "../api/client"
  import { navigate } from "../router.svelte.ts"

  let {
    rantId,
    upvotes = $bindable(),
    downvotes = $bindable(),
    initialVote,
  } = $props<{
    rantId: string
    upvotes: number
    downvotes: number
    initialVote: "up" | "down" | null
  }>()

  let currentVote = $state<"up" | "down" | null>(null)
  let isVoting = $state(false)

  $effect(() => {
    currentVote = initialVote
  })

  const netScore = $derived(upvotes - downvotes)

  async function handleVote(type: "up" | "down") {
    if (!auth.isAuthenticated) {
      navigate("/login")
      return
    }
    if (isVoting) return

    const prevVote = currentVote
    const prevUp = upvotes
    const prevDown = downvotes

    let upDelta = 0
    let downDelta = 0

    if (currentVote === null) {
      upDelta = type === "up" ? 1 : 0
      downDelta = type === "down" ? 1 : 0
      currentVote = type
    } else if (currentVote === type) {
      upDelta = type === "up" ? -1 : 0
      downDelta = type === "down" ? -1 : 0
      currentVote = null
    } else {
      upDelta = type === "up" ? 1 : -1
      downDelta = type === "down" ? 1 : -1
      currentVote = type
    }

    upvotes += upDelta
    downvotes += downDelta
    isVoting = true

    try {
      await apiRequest("/api/interactions/votes", {
        method: "POST",
        body: JSON.stringify({ rantId, voteType: type })
      })
    } catch {
      upvotes = prevUp
      downvotes = prevDown
      currentVote = prevVote
    } finally {
      isVoting = false
    }
  }
</script>

<div class="vote-widget">
  <button
    class="vote-btn up"
    class:active={currentVote === "up"}
    class:voting={isVoting}
    onclick={() => handleVote("up")}
    aria-label="Upvote"
    disabled={isVoting}
  >
    <svg viewBox="0 0 24 24" width="20" height="20"><polyline points="18 15 12 9 6 15"></polyline></svg>
  </button>
  <span class="vote-count" class:positive={netScore >= 0} class:negative={netScore < 0}>
    {netScore > 0 ? '+' : ''}{netScore}
  </span>
  <button
    class="vote-btn down"
    class:active={currentVote === "down"}
    class:voting={isVoting}
    onclick={() => handleVote("down")}
    aria-label="Downvote"
    disabled={isVoting}
  >
    <svg viewBox="0 0 24 24" width="20" height="20"><polyline points="6 9 12 15 18 9"></polyline></svg>
  </button>
</div>

<style>
  .vote-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-right: var(--border-thin);
    padding-right: 1rem;
    margin-right: 1rem;
    min-width: 50px;
    gap: 0.1rem;
  }
  .vote-btn {
    background: none;
    border: none;
    padding: 4px;
    color: var(--text-tertiary);
    cursor: pointer;
    transition: transform var(--transition-fast), color var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .vote-btn svg {
    stroke: currentColor;
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }
  .vote-btn:disabled {
    cursor: wait;
    opacity: 0.6;
  }
  .vote-btn:not(:disabled):hover {
    transform: scale(1.2);
  }
  .vote-btn.up:not(:disabled):hover,
  .vote-btn.up.active {
    color: var(--color-accent);
  }
  .vote-btn.down:not(:disabled):hover,
  .vote-btn.down.active {
    color: #e74c3c;
  }
  .vote-count {
    font-family: var(--font-serif);
    font-size: 1.15rem;
    font-weight: 700;
  }
  .positive {
    color: var(--color-accent);
  }
  .negative {
    color: #e74c3c;
  }
</style>
