import { Elysia, t } from "elysia"
import { db } from "../db/connection"
import { rants } from "../db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { auth, requireAuth } from "../middleware/auth"
import { anonymizeAuthor } from "../utils/anonymize"

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:3001"

// Batch fetch users from User Service
async function fetchUsersBatch(userIds: string[]): Promise<Record<string, any>> {
  if (userIds.length === 0) return {}
  try {
    const res = await fetch(`${USER_SERVICE_URL}/internal/users/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: userIds }),
    })
    if (res.ok) {
      return await res.json() as Record<string, any>
    }
  } catch (e) {
    console.error("Failed to fetch users in batch:", e)
  }
  return {}
}

export const rantsRoutes = new Elysia({ prefix: "/api/rants" })
  .use(auth)
  // GET /api/rants (Optional auth for admin checks)
  .get(
    "/",
    async ({ query, user, set }) => {
      const page = parseInt(query.page || "1")
      const limit = parseInt(query.limit || "20")
      const offset = (page - 1) * limit
      const { category, status, sort = "new" } = query

      try {
        let conditions = []
        if (category) {
          conditions.push(eq(rants.category, category))
        }
        if (status) {
          conditions.push(eq(rants.status, status))
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined

        // Determine sorting
        let orderByClause
        if (sort === "top") {
          orderByClause = desc(sql`${rants.upvotesCount} - ${rants.downvotesCount}`)
        } else if (sort === "hot") {
          // Sort by gravity/hot logic: net votes first, then newest
          orderByClause = [
            desc(sql`${rants.upvotesCount} - ${rants.downvotesCount}`),
            desc(rants.createdAt)
          ]
        } else {
          orderByClause = desc(rants.createdAt)
        }

        const dbRants = await db
          .select()
          .from(rants)
          .where(whereClause)
          .orderBy(...(Array.isArray(orderByClause) ? orderByClause : [orderByClause]))
          .limit(limit)
          .offset(offset)

        // Fetch users in batch to map names
        const userIds = Array.from(new Set(dbRants.map((r) => r.userId)))
        const userMap = await fetchUsersBatch(userIds)

        const formattedRants = dbRants.map((rant) => ({
          ...rant,
          author: anonymizeAuthor(rant.userId, userMap, rant.isAnonymous, user),
          netVotes: rant.upvotesCount - rant.downvotesCount,
        }))

        return {
          page,
          limit,
          data: formattedRants,
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        category: t.Optional(t.String()),
        status: t.Optional(t.String()),
        sort: t.Optional(t.String()),
      }),
    }
  )
  // GET /api/rants/:id (Optional auth)
  .get(
    "/:id",
    async ({ params, user, set }) => {
      try {
        const [rant] = await db
          .select()
          .from(rants)
          .where(eq(rants.id, params.id))
          .limit(1)

        if (!rant) {
          set.status = 404
          return { error: "Rant not found" }
        }

        const userMap = await fetchUsersBatch([rant.userId])
        const formattedRant = {
          ...rant,
          author: anonymizeAuthor(rant.userId, userMap, rant.isAnonymous, user),
          netVotes: rant.upvotesCount - rant.downvotesCount,
        }

        return formattedRant
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
  // Protected endpoints
  .use(requireAuth)
  // POST /api/rants
  .post(
    "/",
    async ({ body, user, set }) => {
      const { title, body: rantBody, category, isAnonymous = false } = body

      try {
        const [newRant] = await db
          .insert(rants)
          .values({
            userId: user.userId,
            title,
            body: rantBody,
            category,
            isAnonymous,
          })
          .returning()

        return {
          message: "Rant posted successfully",
          rant: newRant,
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 5, maxLength: 200 }),
        body: t.String({ minLength: 10 }),
        category: t.String({
          pattern: "^(akademik|fasilitas|dosen|organisasi|lainnya)$",
        }),
        isAnonymous: t.Optional(t.Boolean()),
      }),
    }
  )
  // PUT /api/rants/:id
  .put(
    "/:id",
    async ({ params, body, user, set }) => {
      const { title, body: rantBody, category, isAnonymous } = body

      try {
        const [existing] = await db
          .select()
          .from(rants)
          .where(eq(rants.id, params.id))
          .limit(1)

        if (!existing) {
          set.status = 404
          return { error: "Rant not found" }
        }

        if (existing.userId !== user.userId) {
          set.status = 403
          return { error: "Forbidden: You are not the author of this rant" }
        }

        const updateData: any = {}
        if (title !== undefined) updateData.title = title
        if (rantBody !== undefined) updateData.body = rantBody
        if (category !== undefined) updateData.category = category
        if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous
        updateData.updatedAt = new Date()

        const [updatedRant] = await db
          .update(rants)
          .set(updateData)
          .where(eq(rants.id, params.id))
          .returning()

        return {
          message: "Rant updated successfully",
          rant: updatedRant,
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
      body: t.Object({
        title: t.Optional(t.String({ minLength: 5, maxLength: 200 })),
        body: t.Optional(t.String({ minLength: 10 })),
        category: t.Optional(t.String({
          pattern: "^(akademik|fasilitas|dosen|organisasi|lainnya)$",
        })),
        isAnonymous: t.Optional(t.Boolean()),
      }),
    }
  )
  // DELETE /api/rants/:id
  .delete(
    "/:id",
    async ({ params, user, set }) => {
      try {
        const [existing] = await db
          .select()
          .from(rants)
          .where(eq(rants.id, params.id))
          .limit(1)

        if (!existing) {
          set.status = 404
          return { error: "Rant not found" }
        }

        // Author or admin can delete
        if (existing.userId !== user.userId && user.role !== "admin") {
          set.status = 403
          return { error: "Forbidden: Unauthorized to delete this rant" }
        }

        await db.delete(rants).where(eq(rants.id, params.id))

        return { message: "Rant deleted successfully" }
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
  // PATCH /api/rants/:id/status (Admin only)
  .patch(
    "/:id/status",
    async ({ params, body, user, set }) => {
      const { status } = body

      try {
        if (user.role !== "admin") {
          set.status = 403
          return { error: "Forbidden: Only admins can change rant status" }
        }

        const [existing] = await db
          .select()
          .from(rants)
          .where(eq(rants.id, params.id))
          .limit(1)

        if (!existing) {
          set.status = 404
          return { error: "Rant not found" }
        }

        const [updatedRant] = await db
          .update(rants)
          .set({ status, updatedAt: new Date() })
          .where(eq(rants.id, params.id))
          .returning()

        return {
          message: "Rant status updated successfully",
          rant: updatedRant,
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
      body: t.Object({
        status: t.String({
          pattern: "^(open|acknowledged|resolved|closed)$",
        }),
      }),
    }
  )
