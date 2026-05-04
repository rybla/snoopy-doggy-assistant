import ai from "@/ai";
import {
  knowledgeBaseDbUri,
  knowledgeBaseRef,
  knowledgeBaseTableName,
} from "@/ai/retrievers";
import { showError } from "@/utilities";
import { Document, DocumentDataSchema, z } from "genkit";
import { WriteMode } from "genkitx-lancedb";
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
      const chunks = chunk(input.text, {
        minLength: 100,
        maxLength: 1000,
        splitter: "sentence",
        overlap: 40,
        delimiters: "",
      });

      const documents = chunks.map((text) =>
        Document.fromText(text, { source: input.source }),
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

export const updateKnowledgeBase = ai.defineFlow(
  "updateKnowledgeBase",
  async () => {
    throw new Error("TODO");
  },
);
