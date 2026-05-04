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
  showError,
} from "@/utilities";
import { Bot, Context, session, type SessionFlavor } from "grammy";

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
  // Format each task as a bullet point and escape the label
  const taskList = tasks
    .map((task) => `• ${escapeMarkdown(task.label)}`)
    .join("\n");
  await ctx.reply(`*Active tasks:*\n\n${taskList}`, {
    parse_mode: "MarkdownV2",
  });
});

bot.command("info", async (ctx) => {
  await ctx.react("👍");
  // Stringify the session data with 4-space indentation
  const escapedJson = escapeMarkdownCodeBlock(
    JSON.stringify(ctx.session ?? null, null, 4),
  );
  await ctx.reply(`\`\`\`json\n${escapedJson}\n\`\`\``, {
    parse_mode: "MarkdownV2",
  });
});

bot.on(":text", async (ctx) => {
  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

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

bot.on(":document", async (ctx) => {
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
      `I've successfully processed your document. Here's a summary:\n\n${summaryResult.summary}\n\nYou can ask me questions about this document or any of the others in the files index.`,
    );
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

// ----------------------------------------------------------------------------
// Start bot
// ----------------------------------------------------------------------------

await bot.start();
