import { navigate } from "../router.svelte.ts"

class AuthState {
  user = $state<any>(null)
  token = $state<string | null>(null)

  constructor() {
    this.load()
    if (typeof window !== "undefined") {
      window.addEventListener("auth-changed", () => this.load())
    }
  }

  load() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")
      this.user = storedUser ? JSON.parse(storedUser) : null
    }
  }

  login(user: any, token: string) {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
    this.user = user
    this.token = token
    window.dispatchEvent(new Event("auth-changed"))
  }

  logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    this.user = null
    this.token = null
    window.dispatchEvent(new Event("auth-changed"))
    navigate("/login")
  }

  get isAuthenticated() {
    return !!this.token
  }

  get isAdmin() {
    return this.user?.role === "admin"
  }
}

export const auth = new AuthState()
