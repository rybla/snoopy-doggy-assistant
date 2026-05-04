import ai from "@/ai";
import * as db from "@/db";
import { do_, showError } from "@/utilities";
import { z } from "genkit";

const dateFormat = "YYYY-MM-DD";

export const createTask = ai.defineTool(
  {
    name: "createTask",
    description: "Create a new task in the task list.",
    inputSchema: z.object({
      label: z
        .string()
        .describe("A concise phrase that captures the essence of the task."),
      description: z
        .string()
        .describe("A one-paragraph description of the task."),
      dueDate: z.optional(
        z
          .string()
          .describe(`The due date for the task in the format ${dateFormat}`),
      ),
    }),
    outputSchema: z.union([
      z.object({
        success: z.literal(true),
        status: z.string(),
      }),
      z.object({
        success: z.literal(false),
        error: z.string(),
      }),
    ]),
  },
  async (input) => {
    try {
      const dueDate = do_(() => {
        try {
          return input.dueDate ? new Date(input.dueDate) : undefined;
        } catch {
          throw new Error(
            `Failed to create the task because "${input.dueDate}" was not a valid date string. Try this tool again with a valid date string of the form "${dateFormat}".`,
          );
        }
      });

      await db.createTask({
        label: input.label,
        description: input.description,
        dueDate,
      });

      return {
        success: true,
        status: `A new task with label "${input.label}" was created.`,
      } as const;
    } catch (error) {
      return {
        success: false,
        error: showError(error),
      } as const;
    }
  },
);
