import ai from "@/ai";
import { knowledgeBaseIndexer } from "@/ai/vectorIndices";
import { Document, DocumentDataSchema, z } from "genkit";

export const searchKnowledgeBase = ai.defineTool(
  {
    name: "searchKnowledgeBase",
    description:
      "Search your knowledge base for content semantically related to a query.",
    inputSchema: z.object({
      query: z.string(),
    }),
    outputSchema: z.object({
      docs: z.array(DocumentDataSchema),
    }),
  },
  async (input) => {
    const docs: Document[] = await ai.retrieve({
      retriever: knowledgeBaseIndexer,
      query: input.query,
    });

    return {
      docs,
    };
  },
);
