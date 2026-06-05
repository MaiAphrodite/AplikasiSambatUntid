<script lang="ts">
  import { auth } from "../lib/stores/auth.svelte.ts"
  import { apiRequest } from "../lib/api/client"
  import { navigate } from "../lib/router.svelte.ts"
  import { onMount } from "svelte"

  let displayName = $state("")
  let password = $state("")
  
  let isSubmitting = $state(false)
  let errorMsg = $state("")
  let successMsg = $state("")

  onMount(() => {
    if (!auth.isAuthenticated) {
      navigate("/login")
      return
    }
    displayName = auth.user?.displayName || ""
  })

  async function handleUpdate(e: SubmitEvent) {
    e.preventDefault()
    
    isSubmitting = true
    errorMsg = ""
    successMsg = ""

    try {
      const payload: Record<string, string> = {}
      if (displayName.trim()) payload.displayName = displayName
      if (password.trim()) payload.password = password

      const res = await apiRequest("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      auth.login(res.user, auth.token!)
      successMsg = "Profil Anda berhasil diperbarui!"
      password = ""
    } catch (e: any) {
      errorMsg = e.message || "Gagal memperbarui profil."
    } finally {
      isSubmitting = false
    }
  }
</script>

<div class="profile-page fade-in">
  <button class="btn btn-secondary back-btn" onclick={() => navigate("/")}>
    <svg class="icon" viewBox="0 0 24 24" style="margin-right: 0.5rem;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
    KEMBALI
  </button>

  <div class="profile-container">
    <div class="profile-header">
      <h2>PENGATURAN PROFIL</h2>
      <p>Kelola data personal Anda di portal Aspirasi Sambat Untid.</p>
    </div>

    {#if auth.user}
      <div class="user-info-banner">
        <div class="info-item">
          <span class="label">Username</span>
          <span class="value">@{auth.user.username}</span>
        </div>
        <div class="info-item">
          <span class="label">Alamat Email</span>
          <span class="value">{auth.user.email || 'Belum diatur'}</span>
        </div>
        <div class="info-item">
          <span class="label">Hak Akses / Peran</span>
          <span class="value role-badge">{auth.user.role}</span>
        </div>
      </div>
    {/if}

    <form onsubmit={handleUpdate}>
      <div class="form-group">
        <label for="display-name-input" class="form-label">Nama Tampilan (Display Name)</label>
        <input 
          id="display-name-input"
          type="text" 
          class="form-control" 
          placeholder="Masukkan nama tampilan baru..."
          bind:value={displayName}
          required
        />
        <small class="helper-text">Nama ini akan terlihat publik saat Anda mengirim aspirasi secara tidak anonim.</small>
      </div>

      <div class="form-group">
        <label for="password-input" class="form-label">Ubah Kata Sandi (Opsional)</label>
        <input 
          id="password-input"
          type="password" 
          class="form-control" 
          placeholder="Ketik kata sandi baru jika ingin mengubah..."
          bind:value={password}
          minlength="6"
        />
        <small class="helper-text">Biarkan kosong jika Anda tidak ingin mengubah kata sandi lama.</small>
      </div>

      {#if errorMsg}
        <div class="error-box">{errorMsg}</div>
      {/if}

      {#if successMsg}
        <div class="success-box">{successMsg}</div>
      {/if}

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" disabled={isSubmitting || !displayName.trim()}>
          {isSubmitting ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .back-btn {
    margin-bottom: 1.5rem;
  }
  .profile-container {
    border: var(--border-thin);
    background-color: var(--bg-secondary);
    padding: 2rem;
    max-width: 700px;
    margin: 0 auto;
  }
  .profile-header {
    border-bottom: var(--border-thick);
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }
  .profile-header h2 {
    font-family: var(--font-serif);
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text-primary);
  }
  .profile-header p {
    font-family: var(--font-serif);
    font-style: italic;
    color: var(--text-secondary);
    font-size: 0.95rem;
    margin-top: 0.25rem;
  }
  .user-info-banner {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    background-color: var(--bg-tertiary);
    border: var(--border-thin);
    padding: 1.2rem;
    margin-bottom: 2rem;
  }
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .info-item .label {
    font-size: 0.7rem;
    text-transform: uppercase;
    color: var(--text-secondary);
    letter-spacing: 0.5px;
    font-weight: 600;
  }
  .info-item .value {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .role-badge {
    text-transform: uppercase;
    color: var(--color-accent) !important;
  }
  .helper-text {
    display: block;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-top: 0.25rem;
  }
  .error-box, .success-box {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    text-align: center;
  }
  .error-box {
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid #e74c3c;
    color: #e74c3c;
  }
  .success-box {
    background-color: rgba(44, 160, 28, 0.1);
    border: 1px solid var(--status-resolved);
    color: var(--status-resolved);
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
    border-top: var(--border-thin);
    padding-top: 1.5rem;
  }
</style>
