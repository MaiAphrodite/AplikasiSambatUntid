<script lang="ts">
  import { auth } from "../lib/stores/auth.svelte.ts"
  import { apiRequest } from "../lib/api/client"
  import { navigate } from "../lib/router.svelte.ts"
  import { onMount } from "svelte"

  let isLoginMode = $state(true)

  let loginEmail = $state("")
  let loginPassword = $state("")

  let regUsername = $state("")
  let regDisplayName = $state("")
  let regEmail = $state("")
  let regPassword = $state("")

  let isSubmitting = $state(false)
  let errorMsg = $state("")

  onMount(() => {
    if (auth.isAuthenticated) {
      navigate("/")
    }
  })

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault()
    if (!loginEmail || !loginPassword) return

    isSubmitting = true
    errorMsg = ""

    try {
      const res = await apiRequest("/api/users/login", {
        method: "POST",
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      })
      auth.login(res.user, res.token)
      navigate("/")
    } catch (e: any) {
      errorMsg = e.message || "Gagal masuk. Periksa email dan kata sandi Anda."
    } finally {
      isSubmitting = false
    }
  }

  async function handleRegister(e: SubmitEvent) {
    e.preventDefault()
    if (!regUsername || !regEmail || !regPassword) return

    isSubmitting = true
    errorMsg = ""

    try {
      const res = await apiRequest("/api/users/register", {
        method: "POST",
        body: JSON.stringify({
          username: regUsername,
          displayName: regDisplayName || regUsername,
          email: regEmail,
          password: regPassword
        })
      })
      auth.login(res.user, res.token)
      navigate("/")
    } catch (e: any) {
      errorMsg = e.message || "Gagal mendaftar. Silakan coba lagi."
    } finally {
      isSubmitting = false
    }
  }

  function switchTab(login: boolean) {
    isLoginMode = login
    errorMsg = ""
  }
</script>

<div class="auth-page fade-in">
  <div class="auth-container">
    <div class="auth-header">
      <svg class="auth-logo" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <h2>PORTAL ASPIRASI</h2>
      <p>Masuk atau daftar untuk menyuarakan aspirasi Anda</p>
    </div>

    <div class="auth-tabs">
      <button class="tab-btn" class:active={isLoginMode} onclick={() => switchTab(true)}>MASUK</button>
      <button class="tab-btn" class:active={!isLoginMode} onclick={() => switchTab(false)}>DAFTAR</button>
    </div>

    <div class="auth-body">
      {#if isLoginMode}
        <form onsubmit={handleLogin}>
          <div class="form-group">
            <label for="login-email" class="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              class="form-control"
              placeholder="nama@untid.ac.id"
              bind:value={loginEmail}
              required
            />
          </div>

          <div class="form-group">
            <label for="login-password" class="form-label">Kata Sandi</label>
            <input
              id="login-password"
              type="password"
              class="form-control"
              placeholder="••••••••"
              bind:value={loginPassword}
              required
            />
          </div>

          {#if errorMsg}
            <div class="error-box">{errorMsg}</div>
          {/if}

          <button type="submit" class="btn btn-primary btn-block" disabled={isSubmitting}>
            {#if isSubmitting}
              <div class="btn-spinner"></div>
              MEMPROSES…
            {:else}
              <svg class="icon" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              MASUK
            {/if}
          </button>
        </form>
      {:else}
        <form onsubmit={handleRegister}>
          <div class="form-group">
            <label for="reg-username" class="form-label">Username</label>
            <input
              id="reg-username"
              type="text"
              class="form-control"
              placeholder="testuser"
              bind:value={regUsername}
              required
              minlength="3"
              maxlength="50"
            />
            <small class="helper-text">Huruf, angka, dan underscore. Min 3 karakter.</small>
          </div>

          <div class="form-group">
            <label for="reg-displayname" class="form-label">Nama Tampilan</label>
            <input
              id="reg-displayname"
              type="text"
              class="form-control"
              placeholder="Budi Sudarsono"
              bind:value={regDisplayName}
            />
            <small class="helper-text">Terlihat publik saat posting non-anonim.</small>
          </div>

          <div class="form-group">
            <label for="reg-email" class="form-label">Email</label>
            <input
              id="reg-email"
              type="email"
              class="form-control"
              placeholder="nama@untid.ac.id"
              bind:value={regEmail}
              required
            />
          </div>

          <div class="form-group">
            <label for="reg-password" class="form-label">Kata Sandi</label>
            <input
              id="reg-password"
              type="password"
              class="form-control"
              placeholder="Minimal 6 karakter"
              bind:value={regPassword}
              required
              minlength="6"
            />
          </div>

          {#if errorMsg}
            <div class="error-box">{errorMsg}</div>
          {/if}

          <button type="submit" class="btn btn-primary btn-block" disabled={isSubmitting}>
            {#if isSubmitting}
              <div class="btn-spinner"></div>
              MEMBUAT AKUN…
            {:else}
              <svg class="icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              DAFTAR
            {/if}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>

<style>
  .auth-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
    padding: 2rem 0;
  }
  .auth-container {
    width: 100%;
    max-width: 420px;
    border: var(--border-thin);
    background-color: var(--bg-secondary);
  }
  .auth-header {
    text-align: center;
    padding: 2rem 2rem 1rem;
    border-bottom: var(--border-thin);
  }
  .auth-logo {
    width: 40px;
    height: 40px;
    stroke: var(--color-accent);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
    margin-bottom: 0.5rem;
  }
  .auth-header h2 {
    font-family: var(--font-serif);
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 0.25rem;
  }
  .auth-header p {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .auth-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: var(--border-thin);
  }
  .tab-btn {
    background: none;
    border: none;
    padding: 0.8rem;
    font-family: var(--font-sans);
    font-weight: 700;
    font-size: 0.85rem;
    letter-spacing: 1px;
    color: var(--text-secondary);
    cursor: pointer;
    text-transform: uppercase;
    transition: all var(--transition-fast);
    border-bottom: 2px solid transparent;
  }
  .tab-btn:hover {
    color: var(--text-primary);
    background-color: var(--bg-tertiary);
  }
  .tab-btn.active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
    background-color: var(--bg-tertiary);
  }
  .auth-body {
    padding: 1.5rem 2rem 2rem;
  }
  .btn-block {
    width: 100%;
    justify-content: center;
    padding: 0.8rem;
    margin-top: 1rem;
  }
  .btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0,0,0,0.2);
    border-top-color: var(--bg-primary);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-right: 0.5rem;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .helper-text {
    display: block;
    font-size: 0.7rem;
    color: var(--text-tertiary);
    margin-top: 0.25rem;
  }
  .error-box {
    background-color: rgba(231, 76, 60, 0.1);
    border: 1px solid #e74c3c;
    color: #e74c3c;
    padding: 0.8rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    text-align: center;
  }
</style>
