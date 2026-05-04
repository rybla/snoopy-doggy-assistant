import { knowledgeBaseDbUri, knowledgeBaseTableName } from "@/ai/retrievers";
import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";
import { lancedb } from "genkitx-lancedb";

const ai = genkit({
  plugins: [
    googleAI(),
    lancedb([
      {
        dbUri: knowledgeBaseDbUri,
        tableName: knowledgeBaseTableName,
        embedder: googleAI.embedder("gemini-embedding-001"),
      },
    ]),
  ],
});

export default ai;
