import ai from "@/ai";
import { WriteMode } from "genkitx-lancedb";
import { Document, DocumentDataSchema, z } from "genkit";
import { chunk } from "llm-chunk";
import { knowledgeBaseRef } from "@/ai/retrievers";
import { showError } from "@/utilities";

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
        k: 3,
      } as never,
    });

    return { docs };
  },
);
