import ai from "@/ai";
import { googleAI } from "@genkit-ai/google-genai";
import { getWeather } from "@/ai/tools/examples";

export const getWeatherInTwoCities = ai.defineFlow(
  "getWeatherInTwoCities",
  async () => {
    const response = await ai.generate({
      model: googleAI.model("gemini-3.1-flash-lite-preview"),
      tools: [getWeather],
      maxTurns: 4,
      prompt: "Get the current weather in Los Angeles and Boston.",
    });

    console.log(response);
  },
);
