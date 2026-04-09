import { createTransport, type Transporter } from "nodemailer";
import { env } from "../config.js";
import { prisma } from "../db/client.js";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
    if (transporter) return transporter;

    const config = env();
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
        return null;
    }

    transporter = createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
        },
    });

    return transporter;
}

interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
    log?: {
        userId?: string;
        template?: string;
    };
}

export async function sendMail(options: SendMailOptions): Promise<void> {
    const transport = getTransporter();
    const config = env();

    if (!transport) {
        return;
    }

    try {
        await transport.sendMail({
            from: config.SMTP_FROM ?? config.SMTP_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });

        if (options.log) {
            await prisma.emailLog
                .create({
                    data: {
                        userId: options.log.userId,
                        to: options.to,
                        subject: options.subject,
                        template: options.log.template,
                        status: "sent",
                    },
                })
                .catch(() => {});
        }
    } catch (err) {
        if (options.log) {
            await prisma.emailLog
                .create({
                    data: {
                        userId: options.log.userId,
                        to: options.to,
                        subject: options.subject,
                        template: options.log.template,
                        status: "failed",
                        error: err instanceof Error ? err.message : String(err),
                    },
                })
                .catch(() => {});
        }
    }
}
