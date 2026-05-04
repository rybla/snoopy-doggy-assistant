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

export async function createTask(input: {
  label: string;
  description: string;
  dueDate?: Date;
}) {
  return await db.insert(schema.tasks).values({
    label: input.label,
    description: input.description,
    dueDate: input.dueDate,
    creationDate: new Date(),
  });
}

export async function completeTask(input: { id: number }) {
  await db
    .update(schema.tasks)
    .set({ completionDate: new Date() })
    .where(eq(schema.tasks.id, input.id));
}

export async function getActiveTasks() {
  return await db.query.tasks.findMany({
    where: (task, { isNull }) => isNull(task.completionDate),
  });
}
