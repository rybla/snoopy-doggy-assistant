import ai from "@/ai";
import { googleAI } from "@genkit-ai/google-genai";
import { z } from "genkit";

/**
 * Summarizes the provided content using the Gemini 3.1 Pro model.
 *
 * @param input.content The text content to summarize.
 * @returns An object containing the generated summary.
 */
export const summarize = ai.defineFlow(
  {
    name: "summarize",
    inputSchema: z.object({
      content: z.string(),
    }),
    outputSchema: z.object({
      summary: z.string(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      model: googleAI.model("gemini-3.1-flash-lite-preview"),
      prompt: `Please provide a concise one-paragraph summary of the following document:\n\n${input.content}`,
    });

    return { summary: response.text };
  },
);
