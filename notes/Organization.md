# Organization

## Source Code Organization

All source code is in `src/`.

AI modules:

- The module "@/ai" exports the single Genkit client that is used throughout the app.
- The modules "@/ai/*" are all the AI-related modules.
- The module "@/ai/flows" exports all flows.
- The modules "@/ai/flows/*" are all the Genkit flows.
- The module "@/ai/tools" exports all tools.
- The modules "@/ai/tools/*" are all the Genkit tools.

Database modules:

- The module "@/db" exports all database-related functions, including all database queries.
- The module "@/db/schema" defines the database schema.
- The modules "@/db/*" are all the Database-related modules.

Telegram bot modules:

- The module "@/telegramBot" defines the telegram bot service.
