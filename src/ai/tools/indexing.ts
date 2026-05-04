import ai from "@/ai";
import {
  knowledgeBaseRef,
  knowledgeBaseDbUri,
  knowledgeBaseTableName,
} from "@/ai/retrievers";
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
      retriever: knowledgeBaseRef,
      query: input.query,
      options: {
        dbUri: knowledgeBaseDbUri,
        tableName: knowledgeBaseTableName,
        whereFilter: null,
        k: 3,
      } as never,
    });

    return {
      docs,
    };
  },
);
