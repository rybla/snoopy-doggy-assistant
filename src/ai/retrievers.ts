import { lancedbRetrieverRef } from "genkitx-lancedb";

export const knowledgeBaseTableName = "table";
export const knowledgeBaseDbUri = "database/lance/v1";

export const knowledgeBaseRef = lancedbRetrieverRef({
  displayName: "KnowledgeBase",
  tableName: knowledgeBaseTableName,
});
