import ai from "@/ai";
import {
  filesDbUri,
  filesRef,
  filesTableName,
  knowledgeBaseDbUri,
  knowledgeBaseRef,
  knowledgeBaseTableName,
} from "@/ai/retrievers";
import { Document, z } from "genkit";

export const searchKnowledgeBase = ai.defineTool(
  {
    name: "searchKnowledgeBase",
    description:
      "Search your knowledge base for content semantically related to a query.",
    inputSchema: z.object({
      query: z.string(),
    }),
    outputSchema: z.object({
      results: z.array(z.string()),
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
      results: docs.map((d) => d.text),
    };
  },
);

export const searchFiles = ai.defineTool(
  {
    name: "searchFiles",
    description:
      "Search your archive of files uploaded by the user for clauses that are semantically related to the query.",
    inputSchema: z.object({
      query: z.string(),
    }),
    outputSchema: z.object({
      results: z.array(z.string()),
    }),
  },
  async (input) => {
    const docs: Document[] = await ai.retrieve({
      retriever: filesRef,
      query: input.query,
      options: {
        dbUri: filesDbUri,
        tableName: filesTableName,
        whereFilter: null,
        k: 3,
      } as never,
    });

    return {
      results: docs.map((d) => d.text),
    };
  },
);
