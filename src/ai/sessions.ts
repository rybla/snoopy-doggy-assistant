import { z, type MessageData } from "genkit";

const SessionIdPrefix = "SessionId_";
export type SessionId = z.infer<typeof SessionIdSchema>;
export const SessionIdSchema = z
  .string()
  .refine((s) => s.startsWith(SessionIdPrefix))
  .brand("SessionId");

export type Session = {
  messages: MessageData[];
};

export const sessions: {
  [key: SessionId]: Session;
} = {};

export function createSession(): SessionId {
  const sessionId = SessionIdSchema.parse(
    `${SessionIdPrefix}${crypto.randomUUID()}`,
  );
  sessions[sessionId] = {
    messages: [],
  };
  return sessionId;
}

export function getSession(sessionId: SessionId): Session {
  const session = sessions[sessionId];
  if (session === undefined)
    throw new Error(`The session with ID "${sessionId}" was missing.`);
  return session;
}
