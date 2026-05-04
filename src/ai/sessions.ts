import { z, type MessageData } from "genkit";

export type SessionId = z.infer<typeof SessionIdSchema>;
export const SessionIdSchema = z
  .string()
  .startsWith("SessionId_")
  .brand("SessionId");

export type Session = {
  messages: MessageData[];
};

export const sessions: {
  [key: SessionId]: Session;
} = {};

export function createSession(): SessionId {
  const sessionId = SessionIdSchema.parse(`SessionId_${crypto.randomUUID()}`);
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
