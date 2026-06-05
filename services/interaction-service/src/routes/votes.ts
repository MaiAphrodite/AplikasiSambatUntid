import { Elysia, t } from "elysia"
import { db } from "../db/connection"
import { votes } from "../db/schema"
import { eq, and } from "drizzle-orm"
import { requireAuth } from "../middleware/auth"
import { checkAndEscalateRant } from "../utils/escalation"

const RANT_SERVICE_URL = process.env.RANT_SERVICE_URL || "http://rant-service:3002"

async function checkRantExists(rantId: string): Promise<boolean> {
  try {
    const res = await fetch(`${RANT_SERVICE_URL}/internal/rants/${rantId}`)
    return res.ok
  } catch (e) {
    return false
  }
}

async function updateRantCounts(
  rantId: string,
  upvotesDelta: number,
  downvotesDelta: number
): Promise<any | null> {
  try {
    const res = await fetch(`${RANT_SERVICE_URL}/internal/rants/${rantId}/counts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upvotesDelta, downvotesDelta }),
    })
    if (res.ok) {
      const data = await res.json() as any
      return data.rant
    }
  } catch (e) {
    console.error("Failed to update rant counts S2S:", e)
  }
  return null
}

export const votesRoutes = new Elysia({ prefix: "/api/interactions/votes" })
  .use(requireAuth)
  .post(
    "/",
    async ({ body, user, set }) => {
      const { rantId, voteType } = body

      const exists = await checkRantExists(rantId)
      if (!exists) {
        set.status = 404
        return { error: "Rant not found" }
      }

      try {
        const [existingVote] = await db
          .select()
          .from(votes)
          .where(and(eq(votes.rantId, rantId), eq(votes.userId, user.userId)))
          .limit(1)

        let upvotesDelta = 0
        let downvotesDelta = 0
        let newVoteType: string | null = voteType

        if (!existingVote) {
          await db.insert(votes).values({
            userId: user.userId,
            rantId,
            voteType,
          })
          if (voteType === "up") upvotesDelta = 1
          else downvotesDelta = 1
        } else if (existingVote.voteType === voteType) {
          await db.delete(votes).where(eq(votes.id, existingVote.id))
          if (voteType === "up") upvotesDelta = -1
          else downvotesDelta = -1
          newVoteType = null
        } else {
          await db
            .update(votes)
            .set({ voteType })
            .where(eq(votes.id, existingVote.id))
          if (voteType === "up") {
            upvotesDelta = 1
            downvotesDelta = -1
          } else {
            upvotesDelta = -1
            downvotesDelta = 1
          }
        }

        const updatedRant = await updateRantCounts(rantId, upvotesDelta, downvotesDelta)

        if (updatedRant) {
          const netVotes = updatedRant.upvotesCount - updatedRant.downvotesCount
          // Non-blocking background call
          checkAndEscalateRant(rantId, netVotes)
        }

        return {
          message: "Vote processed successfully",
          voteType: newVoteType,
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      body: t.Object({
        rantId: t.String(),
        voteType: t.String({ pattern: "^(up|down)$" }),
      }),
    }
  )
  .get(
    "/:rantId/me",
    async ({ params, user, set }) => {
      const { rantId } = params
      try {
        const [existingVote] = await db
          .select()
          .from(votes)
          .where(and(eq(votes.rantId, rantId), eq(votes.userId, user.userId)))
          .limit(1)

        return {
          voteType: existingVote ? existingVote.voteType : null,
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      params: t.Object({
        rantId: t.String(),
      }),
    }
  )
  .delete(
    "/:rantId",
    async ({ params, user, set }) => {
      const { rantId } = params
      try {
        const [existingVote] = await db
          .select()
          .from(votes)
          .where(and(eq(votes.rantId, rantId), eq(votes.userId, user.userId)))
          .limit(1)

        if (!existingVote) {
          return { message: "No vote casted yet" }
        }

        await db.delete(votes).where(eq(votes.id, existingVote.id))

        const upvotesDelta = existingVote.voteType === "up" ? -1 : 0
        const downvotesDelta = existingVote.voteType === "down" ? -1 : 0

        await updateRantCounts(rantId, upvotesDelta, downvotesDelta)

        return { message: "Vote deleted successfully" }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      params: t.Object({
        rantId: t.String(),
      }),
    }
  )
