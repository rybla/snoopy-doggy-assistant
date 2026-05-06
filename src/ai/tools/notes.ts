import ai from "@/ai";
import env from "@/env";
import { escapeFilename, showDate, showError } from "@/utilities";
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
      tags: z
        .array(z.string())
        .describe("A list of categorizational tags for the note."),
    }),
    outputSchema: z.union([
      z.object({ success: z.literal(true), status: z.string() }),
      z.object({ success: z.literal(false), error: z.string() }),
    ]),
  },
  async (input) => {
    try {
      const now = new Date();
      const title = escapeFilename(input.title);

      // Prepend YAML frontmatter with tags to the note content if tags are provided
      let finalContent = input.content;
      const frontmatterLines: string[] = [
        `title: ${input.title}`,
        `author: ${env.ASSISTANT_NAME}`,
        `pubDate: ${showDate(now)}`,
      ];
      if (input.tags.length > 0) {
        frontmatterLines.push(
          `tags:\n${input.tags.map((tag) => `  - ${tag}`).join("\n")}`,
        );
      }
      finalContent =
        `---\n${frontmatterLines.join("\n")}\n---\n\n` + finalContent;

      await Bun.file(path.join(env.NOTES_DIRECTORY, `${title}.md`)).write(
        finalContent,
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
