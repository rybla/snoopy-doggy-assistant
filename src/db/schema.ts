import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z, type MessageData } from "genkit";

export const items = sqliteTable("items", {
  name: text("name"),
});

export type TaskId = z.infer<typeof TaskIdSchema>;
export const TaskIdSchema = z.number().brand("TaskId");

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }).$type<TaskId>(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  creationDate: integer("creationDate", { mode: "timestamp" }).notNull(),
  completionDate: integer("completionDate", { mode: "timestamp" }),
  dueDate: integer("dueDate", { mode: "timestamp" }),
});

export type SessionId = z.infer<typeof SessionIdSchema>;
export const SessionIdSchema = z.number().brand("SessionId");

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }).$type<SessionId>(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  systemPrompt: text("systemPrompt").notNull(),
});

export type MessageId = z.infer<typeof MessageIdSchema>;
export const MessageIdSchema = z.number().brand("MessageId");

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }).$type<MessageId>(),
  sessionId: integer("sessionId")
    .references(() => sessions.id)
    .notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  data: text("data", { mode: "json" }).notNull().$type<MessageData>(),
});

export const sessionMessages = relations(sessions, ({ many }) => ({
  messages: many(messages),
}));

export const messageSession = relations(messages, ({ one }) => ({
  session: one(sessions, {
    fields: [messages.sessionId],
    references: [sessions.id],
  }),
}));
