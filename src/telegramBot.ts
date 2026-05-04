/**
 * module: "@/telegramBot"
 *
 * This module contains the script for serving the telegram bot for this app.
 */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- required by "grammy" */

import { Bot, Context, session, type SessionFlavor } from "grammy";
import env from "@/env";

type SessionData = {
  messageCount: number;
};

type MyContext = Context & SessionFlavor<SessionData>;

// ----------------

const bot = new Bot<MyContext>(env.TELEGRAM_BOT_API_KEY);

// ----------------

function initializeSessionData(): SessionData {
  return { messageCount: 0 };
}

bot.use(
  session({
    initial: initializeSessionData,
  }),
);

bot.use(async (ctx, next) => {
  function reply_unauthorized() {
    ctx.reply("You need authorization in order to use this bot.");
  }

  if (!ctx.from) {
    reply_unauthorized();
    return;
  }

  if (!env.TELEGRAM_ALLOWED_USER_IDS.includes(ctx.from.id)) {
    reply_unauthorized();
    return;
  }

  await next();
});

bot.api.setMyCommands([
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

bot.command("settings", (ctx) => {
  ctx.react("👍");
});

bot.on("message", async (ctx) => {
  ctx.session.messageCount++;
  await ctx.reply(`You have send ${ctx.session.messageCount} messages`);
});

bot.on(":text", async (ctx) => {
  await ctx.reply("Text!");
});
bot.on(":photo", async (ctx) => {
  await ctx.reply("Photo!");
});

// ----------------

bot.start();
