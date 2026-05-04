import { lancedbRetrieverRef } from "@/lancedb";

export const knowledgeBaseTableName = "table";
export const knowledgeBaseDbUri = "databases/lance/knowledgeBase/v1";
export const knowledgeBaseRef = lancedbRetrieverRef({
  displayName: "KnowledgeBase",
  tableName: knowledgeBaseTableName,
});

export const filesTableName = "table";
export const filesDbUri = "databases/lance/files/v1";
export const filesRef = lancedbRetrieverRef({
  displayName: "Files",
  tableName: filesTableName,
});
