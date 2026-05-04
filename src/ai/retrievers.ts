import { lancedbRetrieverRef } from "@/lancedb";

export const knowledgeBaseTableName = "table";
export const knowledgeBaseDbUri = "databases/lance/v1";

export const knowledgeBaseRef = lancedbRetrieverRef({
  displayName: "KnowledgeBase",
  tableName: knowledgeBaseTableName,
});
