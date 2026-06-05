import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { authRoutes } from "./routes/auth"
import { profileRoutes } from "./routes/profile"
import { internalRoutes } from "./routes/internal"

const app = new Elysia()
  .use(cors())
  .use(authRoutes)
  .use(profileRoutes)
  .use(internalRoutes)
  .get("/health", () => ({ status: "OK", service: "user-service" }))
  .listen(3001)

console.log(`User Service running at http://${app.server?.hostname || "localhost"}:${app.server?.port}`)
