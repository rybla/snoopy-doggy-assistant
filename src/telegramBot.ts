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

/**
 * The ID of the most recent user the bot chatted with.
 */
let mostRecentChatId: number | null = null;

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

  // Record the chat ID of the authorized user we are interacting with
  if (ctx.chat?.id) {
    mostRecentChatId = ctx.chat.id;
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

/**
 * Schedules a message to be sent every day at a random time between 9am and 5pm.
 */
function scheduleNextDailyMessage() {
  const now = new Date();

  const nextTarget = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Random time between 09:00:00 and 16:59:59
  const randomHour = 9 + Math.floor(Math.random() * 8);
  const randomMinute = Math.floor(Math.random() * 60);
  const randomSecond = Math.floor(Math.random() * 60);

  nextTarget.setHours(randomHour, randomMinute, randomSecond);

  if (nextTarget.getTime() <= now.getTime()) {
    // If the random time for today has already passed, schedule for tomorrow
    nextTarget.setDate(nextTarget.getDate() + 1);
    const nextRandomHour = 9 + Math.floor(Math.random() * 8);
    const nextRandomMinute = Math.floor(Math.random() * 60);
    const nextRandomSecond = Math.floor(Math.random() * 60);
    nextTarget.setHours(nextRandomHour, nextRandomMinute, nextRandomSecond);
  }

  const delay = nextTarget.getTime() - now.getTime();

  setTimeout(() => {
    void (async () => {
      if (mostRecentChatId !== null) {
        try {
          await bot.api.sendMessage(mostRecentChatId, "Hi!");
        } catch (error) {
          console.error("Failed to send scheduled message:", error);
        }
      }
      // Schedule the next one after executing
      scheduleNextDailyMessage();
    })();
  }, delay);
}

// Start the scheduler
scheduleNextDailyMessage();

// ----------------

await bot.start();
