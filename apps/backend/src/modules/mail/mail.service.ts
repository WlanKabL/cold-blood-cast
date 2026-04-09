/**
 * Mail Service — SMTP via nodemailer (Mailcow / any SMTP)
 *
 * Fire-and-forget by default: errors are logged, never thrown.
 * Call `sendMail()` directly if you want to await / catch.
 */

import { createTransport, type Transporter } from "nodemailer";
import { env } from "@/config/env.js";
import { prisma } from "@/config/database.js";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
    if (_transporter) return _transporter;

    const e = env();
    if (!e.SMTP_HOST || !e.SMTP_USER || !e.SMTP_PASS) {
        return null;
    }

    _transporter = createTransport({
        host: e.SMTP_HOST,
        port: e.SMTP_PORT,
        secure: e.SMTP_SECURE,
        auth: {
            user: e.SMTP_USER,
            pass: e.SMTP_PASS,
        },
    });

    return _transporter;
}

export interface MailOptions {
    to: string;
    subject: string;
    html: string;
    /** Optional: log this email in the EmailLog table */
    log?: {
        userId?: string;
        template: string;
        sentBy?: string;
    };
}

/**
 * Send an email. Returns `true` on success, `false` on failure.
 * Never throws — safe to call without try/catch.
 * If `log` is provided, writes an EmailLog entry.
 */
export async function sendMail(options: MailOptions): Promise<boolean> {
    const transporter = getTransporter();
    if (!transporter) {
        console.warn("[Mail] SMTP not configured — skipping email to", options.to);
        return false;
    }

    try {
        await transporter.sendMail({
            from: env().SMTP_FROM,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        if (options.log) {
            void prisma.emailLog
                .create({
                    data: {
                        to: options.to,
                        userId: options.log.userId,
                        template: options.log.template,
                        subject: options.subject,
                        status: "sent",
                        sentBy: options.log.sentBy,
                    },
                })
                .catch(() => {});
        }

        return true;
    } catch (err) {
        console.error("[Mail] Failed to send email to", options.to, err);

        if (options.log) {
            void prisma.emailLog
                .create({
                    data: {
                        to: options.to,
                        userId: options.log.userId,
                        template: options.log.template,
                        subject: options.subject,
                        status: "failed",
                        sentBy: options.log.sentBy,
                        error: err instanceof Error ? err.message : String(err),
                    },
                })
                .catch(() => {});
        }

        return false;
    }
}
