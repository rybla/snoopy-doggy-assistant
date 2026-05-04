import { z } from "genkit";

const EnvSchema = z.object({
  USER_NAME: z.string(),
  ASSISTANT_NAME: z.string(),
  MAX_MESSAGES_LENGTH: z.coerce.number(),
  CURRENT_LOCATION: z.string(),
  FILES_DIRPATH: z.string(),
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
  LOGS_DIRPATH: z.string(),
});

const env = EnvSchema.parse(process.env);

export default env;
