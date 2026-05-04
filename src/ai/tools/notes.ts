import ai from "@/ai";
import env from "@/env";
import { escapeFilename, showError } from "@/utilities";
import { z } from "genkit";
import path from "path";

export const createNote = ai.defineTool(
  {
    name: "createNote",
    description: "Create a note in the user's notebook.",
    inputSchema: z.object({
      title: z.string(),
      content: z
        .string()
        .describe(
          "The complete content of the note, in Markdown format. This content should be fully flushed out, readable, and organized into sections.",
        ),
    }),
    outputSchema: z.union([
      z.object({ success: z.literal(true), status: z.string() }),
      z.object({ success: z.literal(false), error: z.string() }),
    ]),
  },
  async (input) => {
    try {
      const title = escapeFilename(input.title);
      await Bun.file(path.join(env.NOTES_DIRECTORY, `${title}.md`)).write(
        input.content,
      );
      return {
        success: true,
        status: `Created note "${title}"`,
      } as const;
    } catch (error) {
      return {
        success: false,
        error: showError(error),
      } as const;
    }
  },
);
