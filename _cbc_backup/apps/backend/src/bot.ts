/**
 * @file Telegram-Bot mit Secret-Subscribe für ColdBloodCast
 */

import { Telegraf } from "telegraf";
import { subscriberService } from "./services/subscriber.service.js";
import { env } from "./config.js";

const { TELEGRAM_BOT_TOKEN: BOT_TOKEN } = env();

export const bot = new Telegraf(BOT_TOKEN);

// /start erklärt das Abo-Prinzip
bot.start((ctx: any) =>
    ctx.reply(
        `Welcome to Cold Blood Cast Alert Bot!\n` + `To subscribe, send /subscribe <SECRET>.`,
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

bot.command("ping", (ctx) => {
    ctx.reply("🏓 Pong!");
});

export const initializeBot = async () => {
    // Start the bot
    await bot.launch();
    console.log("Telegram bot started.");
};
