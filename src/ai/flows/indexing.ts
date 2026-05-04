import ai from "@/ai";
import { Document, z } from "genkit";
import { chunk } from "llm-chunk";
import { knowledgeBaseIndexer } from "@/ai/vectorIndices";
import { showError } from "@/utilities";

export const addInformationToKnowledgeBase = ai.defineFlow(
  {
    name: "indexGeneralInformation",
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
        indexer: knowledgeBaseIndexer,
        documents,
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
