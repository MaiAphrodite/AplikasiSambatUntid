import { pgTable, uuid, varchar, timestamp, boolean, text } from "drizzle-orm/pg-core"

export const votes = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  rantId: uuid("rant_id").notNull(),
  voteType: varchar("vote_type", { length: 10 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  rantId: uuid("rant_id").notNull(),
  parentId: uuid("parent_id").references((): any => comments.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
