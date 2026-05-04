import ai from "@/ai";
import { searchKnowledgeBase } from "@/ai/tools/indexing";
import { completeTask, createTask, getActiveTasks } from "@/ai/tools/tasks";
import * as db from "@/db";
import { SessionIdSchema } from "@/db/schema";
import env from "@/env";
import { showDate, showTime } from "@/utilities";
import { googleAI } from "@genkit-ai/google-genai";
import { z } from "genkit";

export async function makeSystemPrompt(): Promise<string> {
  const now = new Date();
  return `
Your role is a helpful assistant for the user, ${env.USERNAME}. The user wants to have a friendly discussion, where they talk about many ideas they have, and you help them organize their thoughts. You also have access to a variety of tools for organizing information for the user, writing notes, and presenting information. Make sure to use these tools when appropriate.

## Knowledge Base

You have access to a knowledge base of useful information relevant to the user, which you can search with the appropriate tool. Additional useful information will be periodically be extracted from your conversations and added to the knowledge base.

## Additional Information

- The date is currently ${showDate(now)}
- The time is currently ${showTime(now)}
- The current location is ${env.CURRENT_LOCATION}.
`;
}

export const normalChat = ai.defineFlow(
  {
    name: "normalChat",
    inputSchema: z.object({
      sessionId: SessionIdSchema,
      prompt: z.string(),
    }),
    outputSchema: z.object({
      response: z.string(),
    }),
  },
  async (input) => {
    console.log("normalChat", { input });

    const session = await db.getSession({ id: input.sessionId });
    if (session === undefined) throw new Error("No session");

    const response = await ai.generate({
      model: googleAI.model("gemini-3.1-flash-lite-preview"),
      config: {
        googleSearchRetrieval: true,
        // codeExecution: true,
      },
      tools: [createTask, getActiveTasks, completeTask, searchKnowledgeBase],
      maxTurns: 4,
      messages: session.messages
        .slice(session.messages.length - env.MAX_MESSAGES_LENGTH)
        .map((m) => m.data),
      system: session.systemPrompt,
      prompt: input.prompt,
    });
    if (response.message === undefined) throw new Error("No response");

    await db.addMessages({
      sessionId: input.sessionId,
      messages: [
        {
          role: "user",
          content: [{ text: input.prompt }],
        },
        response.message,
      ],
    });

    return {
      response: response.text,
    };
  },
);
