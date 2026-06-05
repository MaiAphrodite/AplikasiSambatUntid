import { verifyToken } from "../utils/jwt"

export const auth = (app: any) =>
  app.derive(async ({ headers }: any) => {
    const authHeader = headers["authorization"]
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null }
    }
    const token = authHeader.substring(7)
    try {
      const user = await verifyToken(token)
      return { user }
    } catch (e) {
      return { user: null }
    }
  })

export const requireAuth = (app: any) =>
  app.use(auth).guard({
    beforeHandle({ user, set }: any) {
      if (!user) {
        set.status = 401
        return { error: "Unauthorized: Authentication required" }
      }
    }
  })
