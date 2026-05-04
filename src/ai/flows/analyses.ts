import ai from "@/ai";
import { z } from "genkit";

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
    throw new Error("Unimplemented");
  },
);
