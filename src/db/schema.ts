import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { z, type MessageData } from "genkit";

export const items = sqliteTable("items", {
  name: text("name"),
});

// -----------------------------------------------------------------------------
// Tasks
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Sessions and Messages
// -----------------------------------------------------------------------------

export type SessionId = z.infer<typeof SessionIdSchema>;
export const SessionIdSchema = z.number().brand("SessionId");

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }).$type<SessionId>(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  systemPrompt: text("systemPrompt").notNull(),
});

export const sessionRelations = relations(sessions, ({ many }) => ({
  messages: many(messages),
}));

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

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(sessions, {
    fields: [messages.sessionId],
    references: [sessions.id],
  }),
}));

// -----------------------------------------------------------------------------
// Diary
// -----------------------------------------------------------------------------

export type DiaryEntryId = z.infer<typeof DiaryEntryIdSchema>;
export const DiaryEntryIdSchema = z.number().brand("DiaryEntryId");

export const diaryEntries = sqliteTable("diaryEntries", {
  id: integer("id").primaryKey({ autoIncrement: true }).$type<DiaryEntryId>(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  content: text("content").notNull(),
});

export const diaryEntryMessages = sqliteTable(
  "diaryEntryMessages",
  {
    diaryEntryId: integer("diaryEntryId")
      .notNull()
      .references(() => diaryEntries.id)
      .$type<DiaryEntryId>(),
    messageId: integer("messageId")
      .notNull()
      .references(() => messages.id)
      .$type<MessageId>(),
  },
  (t) => [unique("uniqueDiaryEntry").on(t.diaryEntryId)],
);

export const diaryEntryMessagesRelations = relations(
  diaryEntryMessages,
  ({ one }) => ({
    diaryEntry: one(diaryEntries, {
      fields: [diaryEntryMessages.diaryEntryId],
      references: [diaryEntries.id],
    }),
    message: one(messages, {
      fields: [diaryEntryMessages.messageId],
      references: [messages.id],
    }),
  }),
);
