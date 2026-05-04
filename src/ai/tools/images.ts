// import ai from "@/ai";
// import { googleAI } from "@genkit-ai/google-genai";
// import { z } from "genkit";

// export const createDiagram = ai.defineTool(
//   {
//     name: "createDiagram",
//     description: "Create an informative diagram based on some information",
//     inputSchema: z.object({
//       description: z
//         .string()
//         .describe(
//           "A detailed description of the information to include in the diagram.",
//         ),
//     }),
//     outputSchema: z.union([
//       z.object({
//         success: z.literal(true),
//         imageDateUri: z.string(),
//       }),
//       z.object({
//         success: z.literal(false),
//         imageDateUri: z.string(),
//       }),
//     ]),
//   },
//   async (input) => {
//     const response = await ai.generate({
//       model: googleAI.model("gemini-3.1-flash-image-preview"),
//       config: {
//         responseModalities: ["IMAGE"],
//       },
//       system: "TODO",
//       prompt: input.description,
//     });

//     if (response.media === undefined) throw new Error("No media");

//     response.media?.url;

//     return {};
//   },
// );
