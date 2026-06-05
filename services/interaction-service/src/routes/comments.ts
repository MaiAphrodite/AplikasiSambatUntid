import { Elysia, t } from "elysia"
import { db } from "../db/connection"
import { comments } from "../db/schema"
import { eq, and } from "drizzle-orm"
import { auth, requireAuth } from "../middleware/auth"
import { anonymizeAuthor } from "../utils/anonymize"

const RANT_SERVICE_URL = process.env.RANT_SERVICE_URL || "http://rant-service:3002"
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:3001"

async function checkRantExists(rantId: string): Promise<boolean> {
  try {
    const res = await fetch(`${RANT_SERVICE_URL}/internal/rants/${rantId}`)
    return res.ok
  } catch (e) {
    return false
  }
}

async function updateRantCommentCount(rantId: string, commentsDelta: number): Promise<void> {
  try {
    await fetch(`${RANT_SERVICE_URL}/internal/rants/${rantId}/counts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentsDelta }),
    })
  } catch (e) {
    console.error("Failed to update comment count S2S:", e)
  }
}

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
    console.error("Failed to fetch users batch S2S:", e)
  }
  return {}
}

async function getCommentAndRepliesCount(commentId: string): Promise<number> {
  const children = await db.select().from(comments).where(eq(comments.parentId, commentId))
  let count = 1
  for (const child of children) {
    count += await getCommentAndRepliesCount(child.id)
  }
  return count
}

interface CommentNode {
  id: string
  userId: string
  rantId: string
  parentId: string | null
  body: string
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date
  author?: any
  replies: CommentNode[]
}

function buildCommentTree(
  flatComments: any[],
  userMap: Record<string, any>,
  requestingUser: any
): CommentNode[] {
  const commentMap: Record<string, CommentNode> = {}

  for (const c of flatComments) {
    commentMap[c.id] = {
      ...c,
      author: anonymizeAuthor(c.userId, userMap, c.isAnonymous, requestingUser),
      replies: [],
    }
  }

  const roots: CommentNode[] = []

  for (const c of flatComments) {
    const node = commentMap[c.id]
    if (c.parentId) {
      const parent = commentMap[c.parentId]
      if (parent) {
        parent.replies.push(node)
      } else {
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  }

  const sortByDate = (a: CommentNode, b: CommentNode) => a.createdAt.getTime() - b.createdAt.getTime()

  roots.sort(sortByDate)
  for (const key in commentMap) {
    commentMap[key].replies.sort(sortByDate)
  }

  return roots
}

export const commentsRoutes = new Elysia({ prefix: "/api/interactions/comments" })
  .use(auth)
  // GET /api/interactions/comments/:rantId
  .get(
    "/:rantId",
    async ({ params, user, set }) => {
      const { rantId } = params

      try {
        const flatComments = await db
          .select()
          .from(comments)
          .where(eq(comments.rantId, rantId))

        const userIds = Array.from(new Set(flatComments.map((c) => c.userId)))
        const userMap = await fetchUsersBatch(userIds)

        const commentTree = buildCommentTree(flatComments, userMap, user)
        return commentTree
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
  // Protected routes
  .use(requireAuth)
  // POST /api/interactions/comments
  .post(
    "/",
    async ({ body, user, set }) => {
      const { rantId, body: commentBody, isAnonymous = false, parentId } = body

      const exists = await checkRantExists(rantId)
      if (!exists) {
        set.status = 404
        return { error: "Rant not found" }
      }

      try {
        // If parentId is provided, verify parent comment exists and belongs to the same rant
        if (parentId) {
          const [parent] = await db
            .select()
            .from(comments)
            .where(and(eq(comments.id, parentId), eq(comments.rantId, rantId)))
            .limit(1)

          if (!parent) {
            set.status = 400
            return { error: "Invalid parent comment (not found or belongs to a different rant)" }
          }
        }

        const [newComment] = await db
          .insert(comments)
          .values({
            userId: user.userId,
            rantId,
            body: commentBody,
            isAnonymous,
            parentId,
          })
          .returning()

        // Increment comments_count in Rant Service
        await updateRantCommentCount(rantId, 1)

        return {
          message: "Comment added successfully",
          comment: newComment,
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      body: t.Object({
        rantId: t.String(),
        body: t.String({ minLength: 1, maxLength: 1000 }),
        isAnonymous: t.Optional(t.Boolean()),
        parentId: t.Optional(t.String()),
      }),
    }
  )
  // PUT /api/interactions/comments/:id
  .put(
    "/:id",
    async ({ params, body, user, set }) => {
      const { body: commentBody } = body

      try {
        const [existing] = await db
          .select()
          .from(comments)
          .where(eq(comments.id, params.id))
          .limit(1)

        if (!existing) {
          set.status = 404
          return { error: "Comment not found" }
        }

        if (existing.userId !== user.userId) {
          set.status = 403
          return { error: "Forbidden: You are not the author of this comment" }
        }

        const [updatedComment] = await db
          .update(comments)
          .set({
            body: commentBody,
            updatedAt: new Date(),
          })
          .where(eq(comments.id, params.id))
          .returning()

        return {
          message: "Comment updated successfully",
          comment: updatedComment,
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
        body: t.String({ minLength: 1, maxLength: 1000 }),
      }),
    }
  )
  // DELETE /api/interactions/comments/:id
  .delete(
    "/:id",
    async ({ params, user, set }) => {
      try {
        const [existing] = await db
          .select()
          .from(comments)
          .where(eq(comments.id, params.id))
          .limit(1)

        if (!existing) {
          set.status = 404
          return { error: "Comment not found" }
        }

        if (existing.userId !== user.userId && user.role !== "admin") {
          set.status = 403
          return { error: "Forbidden: Unauthorized to delete this comment" }
        }

        // Count comment and its cascading replies before deletion
        const totalDeletedCount = await getCommentAndRepliesCount(params.id)

        await db.delete(comments).where(eq(comments.id, params.id))

        // Decrement comment count in Rant Service
        await updateRantCommentCount(existing.rantId, -totalDeletedCount)

        return {
          message: "Comment deleted successfully",
          deletedCount: totalDeletedCount,
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
