import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { rantsRoutes } from "./routes/rants"
import { internalRoutes } from "./routes/internal"

const app = new Elysia()
  .use(cors())
  .use(rantsRoutes)
  .use(internalRoutes)
  .get("/health", () => ({ status: "OK", service: "rant-service" }))
  .listen(3002)

console.log(`Rant Service running at http://${app.server?.hostname || "localhost"}:${app.server?.port}`)
