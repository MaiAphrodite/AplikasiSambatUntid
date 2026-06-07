<script lang="ts">
  import { auth } from "../lib/stores/auth.svelte.ts"
  import { apiRequest } from "../lib/api/client"
  import { navigate } from "../lib/router.svelte.ts"
  import { onMount } from "svelte"

  let title = $state("")
  let category = $state("akademik")
  let body = $state("")
  let isAnonymous = $state(false)
  let imageFile = $state<File | null>(null)
  let imagePreviewUrl = $state<string | null>(null)
  
  let isSubmitting = $state(false)
  let errorMsg = $state("")

  onMount(() => {
    if (!auth.isAuthenticated) {
      navigate("/login")
    }
  })

  function handleImageChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (input.files && input.files[0]) {
      const file = input.files[0]
      if (file.size > 5 * 1024 * 1024) {
        errorMsg = "Ukuran gambar tidak boleh lebih dari 5MB"
        input.value = ""
        return
      }
      imageFile = file
      imagePreviewUrl = URL.createObjectURL(file)
    }
  }

  function removeImage() {
    imageFile = null
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
      imagePreviewUrl = null
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim() || !category) return

    isSubmitting = true
    errorMsg = ""

    const formData = new FormData()
    formData.append("title", title)
    formData.append("category", category)
    formData.append("body", body)
    formData.append("isAnonymous", isAnonymous.toString())
    if (imageFile) {
      formData.append("image", imageFile)
    }

    try {
      const res = await apiRequest("/api/rants", {
        method: "POST",
        body: formData
      })
      navigate(`/rant/${res.rant.id}`)
    } catch (e: any) {
      errorMsg = e.message || "Gagal menerbitkan aspirasi. Silakan coba lagi."
    } finally {
      isSubmitting = false
    }
  }
</script>

<div class="create-rant-page fade-in">
  <button class="btn btn-secondary back-btn" onclick={() => navigate("/")}>
    <svg class="icon" viewBox="0 0 24 24" style="margin-right: 0.5rem;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
    BATAL
  </button>

  <div class="form-container">
    <div class="form-header">
      <h2>TULIS ASPIRASI BARU</h2>
      <p>Suarakan keluhan, rants, atau masukan untuk prodi secara demokratis.</p>
    </div>

    <form onsubmit={handleSubmit}>
      <div class="form-group">
        <label for="title-input" class="form-label">Judul Aspirasi (Headline)</label>
        <input 
          id="title-input"
          type="text" 
          class="form-control" 
          placeholder="Contoh: WiFi di Gedung A Sering Mati Terputus-putus" 
          bind:value={title} 
          required 
          minlength="5"
          maxlength="200"
        />
        <small class="helper-text">Maksimal 200 karakter. Buat judul yang padat, jelas, dan menggambarkan masalah.</small>
      </div>

      <div class="form-group">
        <label for="category-select" class="form-label">Kategori Masalah</label>
        <select id="category-select" class="form-control" bind:value={category} required>
          <option value="akademik">Akademik & Kurikulum</option>
          <option value="fasilitas">Infrastruktur & Fasilitas Kampus</option>
          <option value="dosen">Tenaga Pendidik / Dosen</option>
          <option value="organisasi">Birokrasi & Organisasi</option>
          <option value="lainnya">Lain-lain / General Rants</option>
        </select>
      </div>

      <div class="form-group">
        <label for="image-input" class="form-label">Lampiran Bukti (Opsional)</label>
        {#if imagePreviewUrl}
          <div class="image-preview-container">
            <img src={imagePreviewUrl} alt="Preview" class="image-preview" />
            <button type="button" class="btn btn-secondary remove-img-btn" onclick={removeImage}>Hapus Gambar</button>
          </div>
        {:else}
          <input 
            id="image-input"
            type="file" 
            class="form-control" 
            accept="image/jpeg, image/png, image/webp"
            onchange={handleImageChange}
          />
          <small class="helper-text">Format: JPG, PNG, WebP. Maks 5MB. Lampirkan foto untuk memperkuat aspirasi Anda.</small>
        {/if}
      </div>

      <div class="form-group">
        <label for="body-input" class="form-label">Kronologi / Penjelasan Masalah</label>
        <textarea 
          id="body-input"
          class="form-control" 
          placeholder="Jelaskan secara detail keluhan Anda, dampak yang dirasakan, dan saran solusi jika ada..." 
          bind:value={body} 
          required 
          minlength="10"
        ></textarea>
        <small class="helper-text">Sampaikan argumen secara konstruktif dan jelas.</small>
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label" style="display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer;">
          <input type="checkbox" bind:checked={isAnonymous} />
          <svg class="icon" viewBox="0 0 24 24" style="stroke: var(--color-accent);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Tulis Secara Anonim
        </label>
        <p class="checkbox-help">Identitas Anda tidak akan ditampilkan ke publik. Hanya admin yang dapat melacak identitas pelapor jika terjadi pelanggaran berat.</p>
      </div>

      {#if errorMsg}
        <div class="error-box">{errorMsg}</div>
      {/if}

      <div class="form-actions">
        <button type="submit" class="btn btn-primary submit-btn" disabled={isSubmitting || !title.trim() || !body.trim()}>
          {isSubmitting ? "MENERBITKAN..." : "TERBITKAN SAMBAT"}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .back-btn {
    margin-bottom: 1.5rem;
  }
  .form-container {
    border: var(--border-thin);
    background-color: var(--bg-secondary);
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  .form-header {
    border-bottom: var(--border-thick);
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }
  .form-header h2 {
    font-family: var(--font-serif);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .form-header p {
    font-family: var(--font-serif);
    font-style: italic;
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-top: 0.25rem;
  }
  .helper-text {
    display: block;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-top: 0.25rem;
  }
  .checkbox-group {
    background-color: var(--bg-tertiary);
    padding: 1rem;
    border: var(--border-thin);
    border-radius: 4px;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-primary);
  }
  .checkbox-help {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.4rem;
    line-height: 1.4;
    padding-left: 1.5rem;
  }
  .error-box {
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid #e74c3c;
    color: #e74c3c;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
    border-top: var(--border-thin);
    padding-top: 1.5rem;
  }
  .submit-btn {
    padding: 0.8rem 2rem;
    font-size: 0.9rem;
  }
  .image-preview-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
    border: 1px dashed var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-tertiary);
  }
  .image-preview {
    max-width: 100%;
    max-height: 300px;
    object-fit: contain;
    border: var(--border-thin);
  }
  .remove-img-btn {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
</style>
