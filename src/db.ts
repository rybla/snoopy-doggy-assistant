import * as schema from "@/db/schema";
import env from "@/env";
import { createClient } from "@libsql/client/sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

// ----------------------------------------------------------------------------
// database client
// ----------------------------------------------------------------------------

const client = createClient({
  url: env.DATABASE_URL,
});

const db = drizzle(client, {
  schema,
});

// ----------------------------------------------------------------------------
// queries
// ----------------------------------------------------------------------------

export function createTask(input: {
  label: string;
  description: string;
  dueDate?: Date;
}) {
  return db.insert(schema.tasks).values({
    label: input.label,
    description: input.description,
    dueDate: input.dueDate,
    creationDate: new Date(),
  });
}

export function completeTask(input: { id: number }) {
  db.update(schema.tasks)
    .set({ completionDate: new Date() })
    .where(eq(schema.tasks.id, input.id));
}

export function getActiveTasks() {
  return db.query.tasks.findMany({
    where: (task, { isNull }) => isNull(task.completionDate),
  });
}
