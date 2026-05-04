import ai from "@/ai";
import {
  knowledgeBaseDbUri,
  knowledgeBaseRef,
  knowledgeBaseTableName,
} from "@/ai/retrievers";
import { getMessagesSince } from "@/db";
import env from "@/env";
import { matchEnum, showError } from "@/utilities";
import { googleAI } from "@genkit-ai/google-genai";
import { Document, DocumentDataSchema, z } from "genkit";
import { WriteMode } from "@/lancedb";
import { chunk } from "llm-chunk";

export const extendKnowledgeBase = ai.defineFlow(
  {
    name: "extendKnowledgeBase",
    inputSchema: z.object({
      text: z.string(),
      source: z.string(),
    }),
    outputSchema: z.union([
      z.object({
        success: z.literal(true),
        documentsCount: z.number(),
      }),
      z.object({
        success: z.literal(false),
        documentsIndexed: z.number(),
        error: z.string(),
      }),
    ]),
  },
  async (input) => {
    try {
      const now = Date.now();

      const chunks = chunk(input.text, {
        minLength: 100,
        maxLength: 1000,
        splitter: "sentence",
        overlap: 40,
        delimiters: "",
      });

      const documents = chunks.map((text) =>
        Document.fromText(text, { source: input.source, timestamp: now }),
      );

      await ai.index({
        indexer: knowledgeBaseRef,
        documents,
        options: {
          writeMode: WriteMode.Append,
        } as never,
      });

      return {
        success: true,
        documentsCount: documents.length,
      } as const;
    } catch (error) {
      return {
        success: false,
        documentsIndexed: 0,
        error: showError(error),
      } as const;
    }
  },
);

export const extendKnowledgeBaseWithDocuments = ai.defineFlow(
  {
    name: "extendKnowledgeBaseWithDocuments",
    inputSchema: z.object({
      documents: z.array(
        z.object({
          text: z.string(),
          source: z.string(),
        }),
      ),
    }),
    outputSchema: z.union([
      z.object({
        success: z.literal(true),
        documentsCount: z.number(),
      }),
      z.object({
        success: z.literal(false),
        documentsIndexed: z.number(),
        error: z.string(),
      }),
    ]),
  },
  async (input) => {
    try {
      const now = Date.now();

      const documents = input.documents.map((item) =>
        Document.fromText(item.text, {
          source: item.source,
          timestamp: now,
        }),
      );

      await ai.index({
        indexer: knowledgeBaseRef,
        documents,
        options: {
          writeMode: WriteMode.Append,
        } as never,
      });

      return {
        success: true,
        documentsCount: documents.length,
      } as const;
    } catch (error) {
      return {
        success: false,
        documentsIndexed: 0,
        error: showError(error),
      } as const;
    }
  },
);

export const queryKnowledgeBase = ai.defineFlow(
  {
    name: "queryKnowledgeBase",
    inputSchema: z.object({
      query: z.string(),
    }),
    outputSchema: z.object({
      docs: z.array(DocumentDataSchema),
    }),
  },
  async (input) => {
    const docs = await ai.retrieve({
      retriever: knowledgeBaseRef,
      query: input.query,
      options: {
        dbUri: knowledgeBaseDbUri,
        tableName: knowledgeBaseTableName,
        whereFilter: null,
        k: 3,
      } as never,
    });

    return { docs };
  },
);

/**
 * Extracts important details from recent messages and inserts them into the knowledge base.
 * This flow takes a start date, fetches messages since that date, and uses the AI model
 * to generate simple declarative sentences summarizing those messages. These sentences
 * are then appended to the vector database.
 */
export const updateKnowledgeBase = ai.defineFlow(
  {
    name: "updateKnowledgeBase",
    inputSchema: z.object({
      startDate: z.coerce.date(),
    }),
    outputSchema: z.union([
      z.object({
        success: z.literal(true),
        paragraphsCount: z.number(),
      }),
      z.object({
        success: z.literal(false),
        error: z.string().optional(),
      }),
    ]),
  },
  async (input) => {
    try {
      // Fetch messages from the database that occurred after the given startDate.
      const messages = await getMessagesSince({ startDate: input.startDate });

      // If there are no new messages, we can return early with success.
      if (messages.length === 0) {
        return { success: true, paragraphsCount: 0 } as const;
      }

      // Use AI to process the messages and generate an exhaustive collection of simple sentences.
      // We instruct the model to use the '<subject> <verb> <object>' structure for optimal retrieval later.
      const response = await ai.generate({
        model: googleAI.model("gemini-3.1-pro-preview"),
        config: {
          thinkingConfig: {
            thinkingLevel: "HIGH",
          },
        },
        system: `
Your task is to extract important details from a chat transcript between an assistant and the user, ${env.USERNAME}, as an exhaustive collection of self-contained paragraphs. Each paragraph should be 2-3 sentences long, and describe a particular detail discussed by ${env.USERNAME}.
        `.trim(),
        prompt: `
Transcript:

${messages
  .map((m) =>
    matchEnum(m.data.role, {
      system() {
        return "";
      },
      tool() {
        return "";
      },
      model() {
        return `**Assistant**\n\n${m.data.content
          .map((c) => (c.text === undefined ? [] : [c.text]))
          .flat()
          .join("")}\n\n`;
      },
      user() {
        return `**${env.USERNAME}**\n\n${m.data.content
          .map((c) => (c.text === undefined ? [] : [c.text]))
          .flat()
          .join("")}\n\n`;
      },
    }),
  )
  .join("")}
        `.trim(),
        output: {
          schema: z.object({
            paragraphs: z.array(z.string()),
          }),
        },
      });

      const paragraphs = response.output?.paragraphs;

      // If the model did not generate any valid paragraphs, return early.
      if (!paragraphs || paragraphs.length === 0) {
        return { success: true, paragraphsCount: 0 } as const;
      }

      // Feed the combined paragraphs into the extendKnowledgeBase flow
      // so they can be chunked, indexed, and stored in the vector database.
      await extendKnowledgeBase({
        text: paragraphs.join("\n"),
        source: "updateKnowledgeBase",
      });

      return { success: true, paragraphsCount: paragraphs.length } as const;
    } catch (error) {
      return { success: false, error: showError(error) } as const;
    }
  },
);
