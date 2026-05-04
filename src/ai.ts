import { googleAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";

const ai = genkit({
  plugins: [googleAI()],
  // model: googleAI.model("gemini-3.1-flash-lite-preview"),
});

export default ai;
