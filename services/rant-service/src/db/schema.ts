import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core"

export const rants = pgTable("rants", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("open").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  upvotesCount: integer("upvotes_count").default(0).notNull(),
  downvotesCount: integer("downvotes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
