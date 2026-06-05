<script lang="ts">
  let { status } = $props<{ status: string }>()

  const labels: Record<string, string> = {
    open: "TERBUKA",
    acknowledged: "DITERIMA / DIDENGAR",
    resolved: "SELESAI / TUNTAS",
    closed: "DITUTUP"
  }
</script>

<span class="badge status-badge {status}">
  {labels[status] || status.toUpperCase()}
</span>

<style>
  .status-badge {
    color: #fff;
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
    font-weight: 700;
  }
  .open {
    background-color: var(--status-open);
  }
  .acknowledged {
    background-color: var(--status-acknowledged);
    color: #000;
  }
  .resolved {
    background-color: var(--status-resolved);
  }
  .closed {
    background-color: var(--status-closed);
  }
</style>
