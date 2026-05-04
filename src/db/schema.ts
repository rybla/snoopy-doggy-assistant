import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  name: text("name"),
});
