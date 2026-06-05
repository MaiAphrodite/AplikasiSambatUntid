import { Elysia, t } from "elysia"
import { db } from "../db/connection"
import { rants } from "../db/schema"
import { eq, sql } from "drizzle-orm"

export const internalRoutes = new Elysia({ prefix: "/internal/rants" })
  .get(
    "/:id",
    async ({ params, set }) => {
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

        return {
          exists: true,
          id: rant.id,
          userId: rant.userId,
          status: rant.status,
          upvotesCount: rant.upvotesCount,
          downvotesCount: rant.downvotesCount,
          commentsCount: rant.commentsCount,
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
  .patch(
    "/:id/counts",
    async ({ params, body, set }) => {
      const { upvotesDelta = 0, downvotesDelta = 0, commentsDelta = 0 } = body

      try {
        const [updatedRant] = await db
          .update(rants)
          .set({
            upvotesCount: sql`${rants.upvotesCount} + ${upvotesDelta}`,
            downvotesCount: sql`${rants.downvotesCount} + ${downvotesDelta}`,
            commentsCount: sql`${rants.commentsCount} + ${commentsDelta}`,
            updatedAt: new Date(),
          })
          .where(eq(rants.id, params.id))
          .returning()

        if (!updatedRant) {
          set.status = 404
          return { error: "Rant not found" }
        }

        return {
          message: "Counts updated successfully",
          rant: {
            id: updatedRant.id,
            upvotesCount: updatedRant.upvotesCount,
            downvotesCount: updatedRant.downvotesCount,
            commentsCount: updatedRant.commentsCount,
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
      body: t.Object({
        upvotesDelta: t.Optional(t.Integer()),
        downvotesDelta: t.Optional(t.Integer()),
        commentsDelta: t.Optional(t.Integer()),
      }),
    }
  )
  .patch(
    "/:id/status",
    async ({ params, body, set }) => {
      const { status } = body

      try {
        const [updatedRant] = await db
          .update(rants)
          .set({ status, updatedAt: new Date() })
          .where(eq(rants.id, params.id))
          .returning()

        if (!updatedRant) {
          set.status = 404
          return { error: "Rant not found" }
        }

        return {
          message: "Status updated successfully",
          rant: {
            id: updatedRant.id,
            status: updatedRant.status,
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
      body: t.Object({
        status: t.String({
          pattern: "^(open|acknowledged|resolved|closed)$",
        }),
      }),
    }
  )
