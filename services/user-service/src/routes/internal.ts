import { Elysia, t } from "elysia"
import { db } from "../db/connection"
import { users } from "../db/schema"
import { eq, inArray } from "drizzle-orm"

export const internalRoutes = new Elysia({ prefix: "/internal/users" })
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, params.id))
          .limit(1)

        if (!dbUser) {
          set.status = 404
          return { error: "User not found" }
        }

        return {
          id: dbUser.id,
          username: dbUser.username,
          displayName: dbUser.displayName,
          role: dbUser.role,
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/batch",
    async ({ body, set }) => {
      const { ids } = body

      if (!ids || ids.length === 0) {
        return {}
      }

      try {
        const dbUsers = await db
          .select({
            id: users.id,
            username: users.username,
            displayName: users.displayName,
            role: users.role,
          })
          .from(users)
          .where(inArray(users.id, ids))

        const userMap: Record<string, any> = {}
        for (const u of dbUsers) {
          userMap[u.id] = u
        }

        return userMap
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      body: t.Object({
        ids: t.Array(t.String()),
      }),
    }
  )
