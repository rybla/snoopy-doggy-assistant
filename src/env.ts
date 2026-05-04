import { z } from "genkit";

const EnvSchema = z.object({
  USERNAME: z.string(),
  MAX_MESSAGES_LENGTH: z.number(),
  CURRENT_LOCATION: z.string(),
  NOTES_DIRECTORY: z.string(),
  //
  DATABASE_URL: z.string(),
  GOOGLE_API_KEY: z.string(),
  TELEGRAM_BOT_API_KEY: z.string(),
  TELEGRAM_ALLOWED_USER_IDS: z
    .string()
    .transform((x) => x.split(" ").map((x) => parseInt(x))),
  HOST: z.string(),
  PORT: z.coerce.number(),
});

const env = EnvSchema.parse(process.env);

export default env;
