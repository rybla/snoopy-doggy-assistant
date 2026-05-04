import ai from "@/ai";
import { getSession, SessionIdSchema } from "@/ai/sessions";
import { completeTask, createTask, getActiveTasks } from "@/ai/tools/tasks";
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

    const session = getSession(input.sessionId);

    const response = await ai.generate({
      model: googleAI.model("gemini-3.1-flash-lite-preview"),
      tools: [createTask, getActiveTasks, completeTask],
      maxTurns: 4,
      messages: session.messages,
      prompt: input.prompt,
    });
    if (response.message === undefined) throw new Error("No response");
    session.messages.push({
      role: "user",
      content: [{ text: input.prompt }],
    });

    return {
      response: response.text,
    };
  },
);
