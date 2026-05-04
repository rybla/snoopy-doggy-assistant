import { makeSystemPrompt } from "@/ai/flows/chatting";
import type { SessionId, TaskId } from "@/db/schema";
import * as schema from "@/db/schema";
import env from "@/env";
import { createClient } from "@libsql/client/sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import type { MessageData } from "genkit";

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
// sessions and messages
// ----------------------------------------------------------------------------

export async function createSession(_input: object) {
  return (
    await db
      .insert(schema.sessions)
      .values({
        systemPrompt: await makeSystemPrompt(),
        timestamp: new Date(),
      })
      .returning()
  )[0]!;
}

export async function getSession(input: { id: SessionId }) {
  return await db.query.sessions.findFirst({
    where: (session, { eq }) => eq(session.id, input.id),
    with: {
      messages: {
        orderBy: (message, { desc }) => desc(message.timestamp),
      },
    },
  });
}

export async function addMessages(input: {
  sessionId: SessionId;
  messages: MessageData[];
}) {
  const timestamp = new Date();

  return await db.insert(schema.messages).values(
    input.messages.map((m) => ({
      timestamp,
      sessionId: input.sessionId,
      data: m,
    })),
  );
}

/**
 * Retrieves all messages from the database that have a timestamp after the given start date.
 * @param input An object containing the startDate to filter messages by.
 * @returns A promise that resolves to an array of messages matching the criteria.
 */
export async function getMessagesSince(input: { startDate: Date }) {
  // Query the messages table for records with a timestamp strictly greater than the provided startDate
  return await db.query.messages.findMany({
    where: (message, { gt }) => gt(message.timestamp, input.startDate),
  });
}

// ----------------------------------------------------------------------------
// tasks
// ----------------------------------------------------------------------------

export async function createTask(input: {
  label: string;
  description: string;
  dueDate?: Date;
}) {
  return (
    await db
      .insert(schema.tasks)
      .values({
        label: input.label,
        description: input.description,
        dueDate: input.dueDate,
        creationDate: new Date(),
      })
      .returning()
  )[0]!;
}

export async function completeTask(input: { id: TaskId }) {
  return (
    await db
      .update(schema.tasks)
      .set({ completionDate: new Date() })
      .where(eq(schema.tasks.id, input.id))
      .returning()
  )[0]!;
}

export async function getActiveTasks() {
  return await db.query.tasks.findMany({
    where: (task, { isNull }) => isNull(task.completionDate),
  });
}
