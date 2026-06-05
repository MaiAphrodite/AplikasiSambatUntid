const AUTH_KEYS = ["token", "user"] as const

function clearAuth() {
  AUTH_KEYS.forEach((k) => localStorage.removeItem(k))
  window.dispatchEvent(new Event("auth-changed"))
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token")
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(path, { ...options, headers })

  if (response.status === 401) {
    clearAuth()
    window.location.hash = "#/login"
    throw new Error("Sesi Anda telah berakhir. Silakan masuk kembali.")
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || `Permintaan gagal (${response.status})`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : ({} as T)
}
