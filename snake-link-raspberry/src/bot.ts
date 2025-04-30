/**
 * @file Telegram-Bot mit Secret-Subscribe für ColdBloodCast
 */

import { Telegraf } from "telegraf";
import * as dotenv from "dotenv";
import { subscriberService } from "./services/subscriber.service.js";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export const bot = new Telegraf(BOT_TOKEN);

// /start erklärt das Abo-Prinzip
bot.start((ctx: any) =>
    ctx.reply(
        `Welcome to Cold Blood Cast Alert Bot!\n` +
            `To subscribe, send /subscribe <SECRET>.`,
    ),
);

// /subscribe <SECRET>
bot.command("subscribe", (ctx: any) => {
    const parts = ctx.message.text.split(" ");
    const code = parts[1] || "";
    if (subscriberService.subscribe(ctx.chat.id, code)) {
        return ctx.reply("✅ You are now subscribed to alerts.");
    }
    return ctx.reply("❌ Invalid code or you’re already subscribed.");
});

// /unsubscribe
bot.command("unsubscribe", (ctx) => {
    if (subscriberService.unsubscribe(ctx.chat.id)) {
        return ctx.reply("🛑 You’ve been unsubscribed.");
    }
    return ctx.reply("ℹ️ You were not subscribed.");
});

export const initializeBot = async () => {
    // Start the bot
    await bot.launch();
    console.log("Telegram bot started.");
}
