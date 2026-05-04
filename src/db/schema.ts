import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  name: text("name"),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(),
  description: text("description").notNull(),
  creationDate: integer("creationDate", { mode: "timestamp" }).notNull(),
  completionDate: integer("completionDate", { mode: "timestamp" }),
  dueDate: integer("dueDate", { mode: "timestamp" }),
});
