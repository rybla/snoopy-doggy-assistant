import { knowledgeBaseIndexer } from "@/ai/vectorIndices";
import { devLocalVectorstore } from "@genkit-ai/dev-local-vectorstore";
import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";

const ai = genkit({
  plugins: [
    googleAI(),
    devLocalVectorstore([
      {
        indexName: knowledgeBaseIndexer.name,
        embedder: googleAI.embedder("gemini-embedding-001"),
      },
    ]),
  ],
});

export default ai;
