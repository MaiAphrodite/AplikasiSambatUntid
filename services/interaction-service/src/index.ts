import { Elysia } from "elysia"
import { cors } from "@elysiajs/cors"
import { votesRoutes } from "./routes/votes"
import { commentsRoutes } from "./routes/comments"

const app = new Elysia()
  .use(cors())
  .use(votesRoutes)
  .use(commentsRoutes)
  .get("/health", () => ({ status: "OK", service: "interaction-service" }))
  .listen(3003)

console.log(`Interaction Service running at http://${app.server?.hostname || "localhost"}:${app.server?.port}`)
