/**
 * module: "@/telegramBot"
 *
 * This module contains the script for serving the telegram bot for this app.
 */

import { summarize } from "@/ai/flows/analyses";
import { makeSystemPrompt, normalChat } from "@/ai/flows/chatting";
import { extendFilesIndex, updateKnowledgeBase } from "@/ai/flows/indexing";
import * as db from "@/db";
import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import type { SessionId } from "@/db/schema";
import env from "@/env";
import { scheduleDailyAction } from "@/schedule";
import {
  escapeMarkdown,
  escapeMarkdownCodeBlock,
  randomItem,
  showError,
} from "@/utilities";
import { Bot, Context, InputFile, session, type SessionFlavor } from "grammy";
import { log } from "@/logger";

type SessionData =
  | undefined
  | {
      sessionId: SessionId;
      messageCount: number;
    };

type MyContext = Context & SessionFlavor<SessionData>;

// ----------------------------------------------------------------------------
// Global state
// ----------------------------------------------------------------------------

/**
 * The ID of the most recently active session.
 */
export let mostRecentSessionId: SessionId | undefined = undefined;

// ----------------------------------------------------------------------------
// Define bot
// ----------------------------------------------------------------------------

const bot = new Bot<MyContext>(env.TELEGRAM_BOT_API_KEY);

function initializeSessionData(): SessionData {
  return undefined;
}

async function getSessionFromContext(ctx: MyContext) {
  let session = ctx.session;
  if (session === undefined) {
    const sessionRow = await db.createSession({
      systemPrompt: makeSystemPrompt(),
    });
    session = {
      sessionId: sessionRow.id,
      messageCount: 0,
    };
  }
  ctx.session = session;
  // Update the global most recent session ID to the current session's ID
  mostRecentSessionId = session.sessionId;

  session.messageCount++;
  return session;
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
  { command: "tasks", description: "Get the active tasks." },
  { command: "info", description: "Get current session info." },
]);

bot.command("test", async (ctx) => {
  const gifFile = new InputFile("assets/diary.gif");
  await ctx.replyWithAnimation(gifFile);
});

bot.command("start", async (ctx) => {
  log("command: start");

  await ctx.react("👍");
  ctx.session = initializeSessionData();
});

bot.command("help", async (ctx) => {
  log("command: help");

  await ctx.react("👍");
  await ctx.reply("TODO");
});

bot.command("settings", async (ctx) => {
  log("command: settings");

  await ctx.react("👍");
  await ctx.reply("TODO");
});

bot.command("tasks", async (ctx) => {
  log("command: tasks");

  await ctx.react("👍");
  const tasks = await db.getActiveTasks();
  // Format each task as a bullet point and escape the label
  const taskList = tasks
    .map((task) => `• ${escapeMarkdown(task.label)}`)
    .join("\n");
  await ctx.reply(`*Active tasks:*\n\n${taskList}`, {
    parse_mode: "MarkdownV2",
  });
});

bot.command("info", async (ctx) => {
  log("command: info");

  await ctx.react("👍");
  await ctx.reply(
    `\`\`\`json\n${escapeMarkdownCodeBlock(
      JSON.stringify(ctx.session ?? null, null, 4),
    )}\n\`\`\``,
    {
      parse_mode: "MarkdownV2",
    },
  );
});

bot.on(":text", async (ctx) => {
  log("on: text", { message: ctx.message });

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    let session = await getSessionFromContext(ctx);

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
  log("on: photo");
  await ctx.reply("I can't respond to photos yet.");
});

bot.on(":document", async (ctx) => {
  log("on: document");

  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    const document = ctx.message?.document;
    if (!document) return;

    if (document.mime_type !== "application/pdf") {
      await ctx.reply("I can only process PDF documents right now.");
      return;
    }

    // Get file info from Telegram
    const file = await ctx.api.getFile(document.file_id);
    if (!file.file_path) {
      await ctx.reply("Could not get the file path from Telegram.");
      return;
    }

    // Download the file from Telegram using fetch
    const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_API_KEY}/${file.file_path}`;
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save locally in the directory specified by env.FILES_DIRPATH
    const filename = document.file_name || `doc_${Date.now()}.pdf`;
    const filepath = path.join(env.FILES_DIRPATH, filename);
    await fs.mkdir(env.FILES_DIRPATH, { recursive: true });
    await fs.writeFile(filepath, buffer);

    // Extract text from the PDF using pdf-parse
    const parser = new PDFParse({ data: buffer });
    const pdfData = await parser.getText();
    const text = pdfData.text;
    await parser.destroy();

    // Extend the files index with the document's content
    const indexResult = await extendFilesIndex({
      text: text,
      source: filename,
    });

    if (!indexResult.success) {
      await ctx.reply(`Failed to index document: ${indexResult.error}`);
      return;
    }

    // Summarize the document's content
    const summaryResult = await summarize({ content: text });

    // Reply to the user with the summary
    await ctx.reply(
      `I've successfully processed your document. Here's a summary:\n\n${summaryResult.summary}\n\nI'm ready to answer questions about this document or any of the others in the files index.`,
    );

    let session = await getSessionFromContext(ctx);
    await db.addMessages({
      sessionId: session.sessionId,
      messages: [
        {
          role: "user",
          content: [
            {
              text: `I've uploaded a document to the files index. This is the document's summary:\n\n${summaryResult.summary}`,
            },
          ],
        },
        {
          role: "model",
          content: [
            {
              text: `I have reviewed the summary and am ready to answer questions about this document or any others in the files index.`,
            },
          ],
        },
      ],
    });
  } catch (error) {
    await ctx.reply(`Error processing document: ${showError(error)}`);
  }
});

// ----------------------------------------------------------------------------
// Scheduled actions
// ----------------------------------------------------------------------------

scheduleDailyAction({
  label: "updateKnowledgeBaseWithDailyTranscript",
  schedule: {
    type: "timeOfDay",
    timeOfDay: { hour: 5, minute: 0 },
  },
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

scheduleDailyAction({
  label: "promptUserWithLastDiaryEntry",
  schedule: {
    type: "sampleTimeOfDay",
    timeOfDayOptions: [
      { hour: 10, minute: 14 },
      { hour: 11, minute: 4 },
      { hour: 13, minute: 2 },
      { hour: 14, minute: 5 },
      { hour: 15, minute: 9 },
    ],
  },
  state: {},
  async action(state) {
    // Retrieve the most recent diary entry from the database
    const lastDiaryEntry = await db.getLastDiaryEntry();

    // If an entry exists, send a summary message to all authorized users
    if (lastDiaryEntry) {
      const message = `
_(diary reminder)_
These were our last conversation topics:

${escapeMarkdown(lastDiaryEntry.content)}
      `.trim();

      for (const userId of env.TELEGRAM_ALLOWED_USER_IDS) {
        // Create an InputFile object from the GIF file
        const gifFile = new InputFile("assets/diary.gif");

        // Send the GIF as an animation to the user
        await bot.api.sendAnimation(userId, gifFile);

        // Send the summary message to the user
        await bot.api.sendMessage(userId, message, {
          parse_mode: "MarkdownV2",
        });
      }
    }

    return state;
  },
});

scheduleDailyAction({
  label: "promptUserWithRandomActiveTask",
  schedule: {
    type: "sampleTimeOfDay",
    timeOfDayOptions: [
      { hour: 10, minute: 45 },
      { hour: 11, minute: 30 },
      { hour: 14, minute: 15 },
      { hour: 16, minute: 45 },
      { hour: 19, minute: 15 },
    ],
  },
  state: {},
  async action(state) {
    // Get all active tasks from the database
    const activeTasks = await db.getActiveTasks();

    const randomTask = randomItem(activeTasks);
    if (randomTask === undefined) return state;

    // Construct the message with the task's label and description
    const message = `
_(active task reminder)_
Btw here's one of your active tasks: *${escapeMarkdown(randomTask.label)}*

${escapeMarkdown(randomTask.description)}
    `.trim();

    // Send the message to all authorized users
    for (const userId of env.TELEGRAM_ALLOWED_USER_IDS) {
      await bot.api.sendMessage(userId, message, {
        parse_mode: "MarkdownV2",
      });
    }

    return state;
  },
});

// ----------------------------------------------------------------------------
// Start bot
// ----------------------------------------------------------------------------

await bot.start();
