import PQueue from "p-queue";
import { bot } from "../bot.js";
import { validateEnv } from "../config.js";

const queue = new PQueue({ interval: 500, intervalCap: 2 });
const env = validateEnv(process.env);

/**
 * Enqueue a Telegram sendMessage call, automatically rate-limited.
 */
export function enqueueAlert(chatId: number, text: string) {
    queue.add(() => {
        if (env.DISABLE_TELEGRAM_BOT) return;
        
        bot.telegram.sendMessage(chatId, text, { parse_mode: "HTML" }).catch((err) => {
            console.error(`❌ Telegram send to ${chatId} failed:`, err.description || err);
        });
    });
}
