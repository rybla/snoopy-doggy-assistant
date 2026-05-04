import ai from "@/ai";
import { searchFilesIndex, searchKnowledgeBase } from "@/ai/tools/indexing";
import { createNote } from "@/ai/tools/notes";
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
Your name is ${env.ASSISTANT_NAME}, and your role is to be a helpful assistant for the user, ${env.USER_NAME}. ${env.USER_NAME} wants to have a friendly discussion, where they talk about many ideas they have, and you help them organize their thoughts. You also have access to a variety of tools at your disposal for organizing information, searching for more information, and writing notes on behalf of ${env.USER_NAME}. Make sure to use these tools when appropriate.

## Knowledge Base

You have access to a knowledge base of useful information relevant to the ${env.USER_NAME}, which you can search with the appropriate tool. Additional useful information will be periodically be extracted from your conversations and added to the knowledge base.

## Notes

${env.USER_NAME} maintains a digital notebook. ${env.USER_NAME} will often want you to write new notes to organize and record their ideas they discuss with you. Use the "createNote" tool to write new notes in this notebook.

## Files Index

You have access to a files index that ${env.USER_NAME} uploads various documents to. If ${env.USER_NAME} asks about files, make sure to search the files index for more info about those files to inform your responses.

## Tasks

A persistent tasks list contains a list of active tasks that ${env.USER_NAME} has indicated they are currently focusing on.

## Composing tool calls

Make the best use of the resources you have available to you via tool calls. Consider the best ways to perform multiple tools calls at once or sequence tool calls to use results of previous tool calls in order to produce the most useful results. Finally, when responding to the user, make sure to integrate together all the results of your thoughts and tool calls into a concise final response (at most one paragraph long).

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
        // googleSearchRetrieval: true,
        // codeExecution: true,
        thinkingConfig: {
          thinkingLevel: "MEDIUM",
        },
      },
      tools: [
        createTask,
        getActiveTasks,
        completeTask,
        searchKnowledgeBase,
        createNote,
        searchFilesIndex,
      ],
      toolChoice: "auto",
      maxTurns: 8,
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
