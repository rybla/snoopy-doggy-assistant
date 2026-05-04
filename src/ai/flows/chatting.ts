import ai from "@/ai";
import { completeTask, createTask, getActiveTasks } from "@/ai/tools/tasks";
import * as db from "@/db";
import { SessionIdSchema } from "@/db/schema";
import { googleAI } from "@genkit-ai/google-genai";
import { z } from "genkit";

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
      tools: [createTask, getActiveTasks, completeTask],
      maxTurns: 4,
      messages: session.messages.map((m) => m.data),
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
