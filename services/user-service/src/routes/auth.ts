import { Elysia, t } from "elysia"
import { db } from "../db/connection"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"
import { signToken } from "../utils/jwt"

export const authRoutes = new Elysia({ prefix: "/api/users" })
  .post(
    "/register",
    async ({ body, set }) => {
      const { username, email, password, displayName } = body

      try {
        // Check if user already exists by email
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (existingUser.length > 0) {
          set.status = 400
          return { error: "Email already registered" }
        }

        // Check if user already exists by username
        const existingUsername = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1)

        if (existingUsername.length > 0) {
          set.status = 400
          return { error: "Username already taken" }
        }

        const passwordHash = await Bun.password.hash(password)

        // Assign 'admin' role if this is the first user, otherwise 'student'
        const allUsers = await db.select().from(users).limit(1)
        const role = allUsers.length === 0 ? "admin" : "student"

        const [newUser] = await db
          .insert(users)
          .values({
            username,
            email,
            passwordHash,
            displayName: displayName || username,
            role,
          })
          .returning()

        const token = await signToken({ userId: newUser.id, role: newUser.role })

        return {
          message: "User registered successfully",
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            displayName: newUser.displayName,
            role: newUser.role,
          },
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      body: t.Object({
        username: t.String({ minLength: 3, maxLength: 50 }),
        email: t.String({ minLength: 5 }),
        password: t.String({ minLength: 6 }),
        displayName: t.Optional(t.String({ maxLength: 100 })),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      const { email, password } = body

      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user) {
          set.status = 401
          return { error: "Invalid email or password" }
        }

        const isMatch = await Bun.password.verify(password, user.passwordHash)
        if (!isMatch) {
          set.status = 401
          return { error: "Invalid email or password" }
        }

        const token = await signToken({ userId: user.id, role: user.role })

        return {
          message: "Login successful",
          token,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            role: user.role,
          },
        }
      } catch (err: any) {
        set.status = 500
        return { error: `Internal Server Error: ${err.message}` }
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
