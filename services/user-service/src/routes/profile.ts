import { Elysia, t } from "elysia"
import { db } from "../db/connection"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"

export const profileRoutes = new Elysia({ prefix: "/api/users" })
  // Public profile fetch (does not require auth)
  .get(
    "/:id/public",
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
          user: {
            id: dbUser.id,
            username: dbUser.username,
            displayName: dbUser.displayName,
            role: dbUser.role,
          },
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
  // Protected routes
  .use(requireAuth)
  .get("/me", async ({ user, set }) => {
    try {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, user.userId))
        .limit(1)

      if (!dbUser) {
        set.status = 404
        return { error: "User not found" }
      }

      return {
        user: {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          displayName: dbUser.displayName,
          role: dbUser.role,
          createdAt: dbUser.createdAt,
        },
      }
    } catch (err: any) {
      set.status = 500
      return { error: `Internal Server Error: ${err.message}` }
    }
  })
  .put(
    "/me",
    async ({ user, body, set }) => {
      const { displayName, password } = body

      try {
        const updateData: any = {}
        if (displayName !== undefined) updateData.displayName = displayName
        if (password !== undefined) {
          updateData.passwordHash = await Bun.password.hash(password)
        }

        if (Object.keys(updateData).length === 0) {
          set.status = 400
          return { error: "No fields to update" }
        }

        updateData.updatedAt = new Date()

        const [updatedUser] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, user.userId))
          .returning()

        return {
          message: "Profile updated successfully",
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            role: updatedUser.role,
          },
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      body: t.Object({
        displayName: t.Optional(t.String({ maxLength: 100 })),
        password: t.Optional(t.String({ minLength: 6 })),
      }),
    }
  )
