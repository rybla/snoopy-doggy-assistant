import { getWeatherInTwoCities } from "@/ai/flows/examples";

Bun.serve({
  fetch: () => {
    // TODO: just have to do this to register flows
    return Response.json([getWeatherInTwoCities]);
  },
});
