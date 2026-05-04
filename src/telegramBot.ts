/**
 * module: "@/telegramBot"
 *
 * This module contains the script for serving the telegram bot for this app.
 */

import { normalChat } from "@/ai/flows/chatting";
import { updateKnowledgeBase } from "@/ai/flows/indexing";
import * as db from "@/db";
import type { SessionId } from "@/db/schema";
import env from "@/env";
import { scheduleDailyAction } from "@/schedule";
import { showError } from "@/utilities";
import { Bot, Context, session, type SessionFlavor } from "grammy";

type SessionData =
  | undefined
  | {
      sessionId: SessionId;
      messageCount: number;
    };

type MyContext = Context & SessionFlavor<SessionData>;

// ----------------------------------------------------------------------------

const bot = new Bot<MyContext>(env.TELEGRAM_BOT_API_KEY);

// ----------------------------------------------------------------------------

function initializeSessionData(): SessionData {
  return undefined;
}

bot.use(
  session({
    initial: initializeSessionData,
  }),
);

bot.use(async (ctx, next) => {
  async function reply_unauthorized() {
    await ctx.reply("You need authorization in order to use this bot.");
  }

  if (!ctx.from) {
    await reply_unauthorized();
    return;
  }

  if (!env.TELEGRAM_ALLOWED_USER_IDS.includes(ctx.from.id)) {
    await reply_unauthorized();
    return;
  }

  await next();
});

await bot.api.setMyCommands([
  { command: "start", description: "Start session." },
  { command: "help", description: "Learn how to use this bot" },
  { command: "settings", description: "Configure your preferences" },
]);

bot.command("start", async (ctx) => {
  await ctx.react("👍");
  ctx.session = initializeSessionData();
});

bot.command("help", async (ctx) => {
  await ctx.react("👍");
  await ctx.reply("TODO");
});

bot.command("settings", async (ctx) => {
  await ctx.react("👍");
  await ctx.reply("TODO");
});

bot.command("tasks", async (ctx) => {
  await ctx.react("👍");
  const tasks = await db.getActiveTasks();
  await ctx.reply(
    `Active tasks:\n\n${tasks.map((task) => `- ${task.label}`).join("\n")}`,
  );
});

bot.command("info", async (ctx) => {
  await ctx.react("👍");
  await ctx.reply(`\`\`\`${JSON.stringify(ctx.session, null, 4)}\`\`\``);
});

bot.on(":text", async (ctx) => {
  try {
    let session = ctx.session;
    if (session === undefined) {
      const sessionRow = await db.createSession({
        systemPrompt: "TODO",
      });
      session = {
        sessionId: sessionRow.id,
        messageCount: 0,
      };
    }
    ctx.session = session;

    session.messageCount++;

    const response = await normalChat({
      sessionId: session.sessionId,
      prompt: ctx.message!.text,
    });

    await ctx.reply(response.response);
  } catch (error) {
    await ctx.reply(`Error: ${showError(error)}`);
  }
});

bot.on(":photo", async (ctx) => {
  await ctx.reply("I can't respond to photos yet.");
});

// ----------------------------------------------------------------------------
// Daily actions
// ----------------------------------------------------------------------------

scheduleDailyAction({
  label: "updateKnowledgeBaseWithDailyTranscript",
  timeOfDay: { hour: 5, minute: 0 },
  state: {} as {
    previousResult?: typeof updateKnowledgeBase extends () => Promise<
      infer Result
    >
      ? Result
      : never;
  },
  async action(_state) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = await updateKnowledgeBase({ startDate: yesterday });
    return { previousResult: result };
  },
});

// ----------------------------------------------------------------------------

await bot.start();
