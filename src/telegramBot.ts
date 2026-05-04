/**
 * module: "@/telegramBot"
 *
 * This module contains the script for serving the telegram bot for this app.
 */

import { normalChat } from "@/ai/flows/chatting";
import { createSession, type SessionId } from "@/ai/sessions";
import * as db from "@/db";
import env from "@/env";
import { showError } from "@/utilities";
import { Bot, Context, session, type SessionFlavor } from "grammy";

type SessionData = {
  sessionId: SessionId;
  messageCount: number;
};

type MyContext = Context & SessionFlavor<SessionData>;

// ----------------

const bot = new Bot<MyContext>(env.TELEGRAM_BOT_API_KEY);

// ----------------

function initializeSessionData(): SessionData {
  return {
    sessionId: createSession(),
    messageCount: 0,
  };
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
});

bot.command("settings", async (ctx) => {
  await ctx.react("👍");
});

bot.command("tasks", async (ctx) => {
  await ctx.react("👍");
  const tasks = await db.getActiveTasks();
  await ctx.reply(
    `Active tasks:\n\n${tasks.map((task) => `- ${task.label}`).join("\n")}`,
  );
});

bot.on(":text", async (ctx) => {
  try {
    ctx.session.messageCount++;

    const response = await normalChat({
      sessionId: ctx.session.sessionId,
      prompt: ctx.message!.text,
    });

    await ctx.reply(response.response);
  } catch (error) {
    await ctx.reply(`Error: ${showError(error)}`);
  }
});

// ----------------

await bot.start();
