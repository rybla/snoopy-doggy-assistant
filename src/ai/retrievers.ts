import { lancedbRetrieverRef } from "@/lancedb";

export const knowledgeBaseTableName = "table";
export const knowledgeBaseDbUri = "databases/lance/knowledgeBase/v1";
export const knowledgeBaseRef = lancedbRetrieverRef({
  displayName: "KnowledgeBase",
  tableName: knowledgeBaseTableName,
});

export const filesIndexTableName = "table";
export const filesIndexDbUri = "databases/lance/filesIndex/v1";
export const filesIndexRef = lancedbRetrieverRef({
  displayName: "FilesIndex",
  tableName: filesIndexTableName,
});
