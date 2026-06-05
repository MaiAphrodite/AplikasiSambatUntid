<script lang="ts">
  let { category } = $props<{ category: string }>()

  const labels: Record<string, string> = {
    akademik: "AKADEMIK & KURIKULUM",
    fasilitas: "INFRASTRUKTUR & FASILITAS",
    dosen: "TENAGA PENDIDIK / DOSEN",
    organisasi: "BIROKRASI & ORGANISASI",
    lainnya: "LAIN-LAIN"
  }
</script>

<span class="badge category-badge {category}">
  {labels[category] || category.toUpperCase()}
</span>

<style>
  .category-badge {
    background-color: var(--bg-tertiary);
    border: var(--border-thin);
    color: var(--text-secondary);
    padding: 0.2rem 0.6rem;
    font-size: 0.7rem;
    font-weight: 700;
  }
  .akademik {
    border-color: #3498db;
    color: #3498db;
  }
  .fasilitas {
    border-color: #e74c3c;
    color: #e74c3c;
  }
  .dosen {
    border-color: #9b59b6;
    color: #9b59b6;
  }
  .organisasi {
    border-color: #1abc9c;
    color: #1abc9c;
  }
  .lainnya {
    border-color: #7f8c8d;
    color: #7f8c8d;
  }
</style>
