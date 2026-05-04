import ai from "@/ai";
import { randomInt, randomItem } from "@/utilities";
import { z } from "genkit";

export const getWeather = ai.defineTool(
  {
    name: "getWeather",
    description: "Gets the current weather in a given location",
    inputSchema: z.object({
      location: z
        .string()
        .describe("The location to get the current weather for"),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // Here, we would typically make an API call or database query. For this
    // example, we just return a fixed value.
    return `The current weather in ${input.location} is ${randomInt(40, 80)}°F and ${randomItem(["sunny", "cloudy"])}.`;
  },
);
