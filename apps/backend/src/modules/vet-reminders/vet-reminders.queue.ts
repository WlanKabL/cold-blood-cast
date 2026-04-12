import pino from "pino";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { getBerlinDayInfo, hasJobRunToday, logJobRun } from "@/helpers/scheduler.js";
import { sendMail } from "@/modules/mail/mail.service.js";
import { vetAppointmentReminderTemplate } from "@/modules/mail/templates/index.js";
import type { VetReminderAppointment } from "@/modules/mail/templates/vet-appointment-reminder.js";

const logger = pino({ name: "vet-reminders" });
const JOB_NAME = "vet-reminders";
const RUN_HOUR = 8; // 08:00 Berlin time

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

interface UserReminderGroup {
    userId: string;
    email: string;
    username: string;
    locale: string;
    appointments: VetReminderAppointment[];
}

async function getUsersWithUpcomingAppointments(): Promise<UserReminderGroup[]> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(todayStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);

    // Fetch both: completed visits with nextAppointment, and scheduled appointments by visitDate
    const [followUpVisits, scheduledVisits] = await Promise.all([
        prisma.vetVisit.findMany({
            where: {
                isAppointment: false,
                nextAppointment: {
                    gte: todayStart,
                    lt: tomorrowEnd,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        locale: true,
                        emailVerified: true,
                    },
                },
                pet: { select: { name: true, species: true } },
                veterinarian: { select: { name: true, clinicName: true } },
            },
        }),
        prisma.vetVisit.findMany({
            where: {
                isAppointment: true,
                visitDate: {
                    gte: todayStart,
                    lt: tomorrowEnd,
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        locale: true,
                        emailVerified: true,
                    },
                },
                pet: { select: { name: true, species: true } },
                veterinarian: { select: { name: true, clinicName: true } },
            },
        }),
    ]);

    const grouped = new Map<string, UserReminderGroup>();

    for (const visit of followUpVisits) {
        if (!visit.user.emailVerified) continue;

        const apptDate = visit.nextAppointment!;
        const isToday = apptDate.toDateString() === now.toDateString();

        const appointment: VetReminderAppointment = {
            petName: visit.pet.name,
            species: visit.pet.species,
            vetName: visit.veterinarian?.name ?? null,
            clinicName: visit.veterinarian?.clinicName ?? null,
            appointmentDate: apptDate.toLocaleDateString(
                visit.user.locale === "de" ? "de-DE" : "en-US",
                {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                },
            ),
            isToday,
        };

        const existing = grouped.get(visit.userId);
        if (existing) {
            existing.appointments.push(appointment);
        } else {
            grouped.set(visit.userId, {
                userId: visit.user.id,
                email: visit.user.email,
                username: visit.user.username,
                locale: visit.user.locale,
                appointments: [appointment],
            });
        }
    }

    for (const visit of scheduledVisits) {
        if (!visit.user.emailVerified) continue;

        const apptDate = visit.visitDate;
        const isToday = apptDate.toDateString() === now.toDateString();

        const appointment: VetReminderAppointment = {
            petName: visit.pet.name,
            species: visit.pet.species,
            vetName: visit.veterinarian?.name ?? null,
            clinicName: visit.veterinarian?.clinicName ?? null,
            appointmentDate: apptDate.toLocaleDateString(
                visit.user.locale === "de" ? "de-DE" : "en-US",
                {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                },
            ),
            isToday,
        };

        const existing = grouped.get(visit.userId);
        if (existing) {
            existing.appointments.push(appointment);
        } else {
            grouped.set(visit.userId, {
                userId: visit.user.id,
                email: visit.user.email,
                username: visit.user.username,
                locale: visit.user.locale,
                appointments: [appointment],
            });
        }
    }

    return [...grouped.values()];
}

async function sendVetReminders(): Promise<number> {
    const groups = await getUsersWithUpcomingAppointments();
    if (groups.length === 0) return 0;

    const frontendUrl = env().FRONTEND_URL;
    let sent = 0;

    for (const group of groups) {
        const html = vetAppointmentReminderTemplate({
            username: group.username,
            appointments: group.appointments,
            dashboardUrl: `${frontendUrl}/vet-visits`,
            locale: group.locale,
        });

        const subject = group.locale === "de" ? "Tierarzt-Erinnerung" : "Vet Appointment Reminder";

        const ok = await sendMail({
            to: group.email,
            subject,
            html,
            log: {
                userId: group.userId,
                template: "vet-appointment-reminder",
            },
        });

        if (ok) sent++;
    }

    return sent;
}

export function startVetReminderScheduler(): void {
    if (schedulerInterval) return;

    let running = false;

    const tick = async () => {
        if (running) return;
        running = true;

        try {
            const { dateStr, hour } = getBerlinDayInfo(new Date());

            if (hour !== RUN_HOUR) return;
            if (await hasJobRunToday(JOB_NAME, dateStr)) return;

            const startedAt = new Date();
            logger.info("Starting vet reminder check (08:00 Berlin)");

            const sent = await sendVetReminders();

            await logJobRun(JOB_NAME, "success", startedAt, { emailsSent: sent });
            logger.info({ emailsSent: sent }, "Vet reminder check completed");
        } catch (err) {
            await logJobRun(JOB_NAME, "error", new Date(), undefined, String(err));
            logger.error({ err }, "Vet reminder check failed");
        } finally {
            running = false;
        }
    };

    schedulerInterval = setInterval(tick, 60_000);
    tick().catch((err) => logger.error({ err }, "Initial vet reminder tick failed"));

    logger.info(`Vet reminder scheduler started (daily at ${RUN_HOUR}:00 Berlin)`);
}

export function stopVetReminderScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        logger.info("Vet reminder scheduler stopped");
    }
}
