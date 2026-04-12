/**
 * Community Notification Helper
 *
 * Sends opt-in email to profile owners when they receive a new comment.
 * Fire-and-forget — errors are logged, never thrown.
 */

import { prisma } from "@/config/database.js";
import { sendMail } from "@/modules/mail/mail.service.js";
import { newCommentTemplate } from "@/modules/mail/templates/new-comment.js";

type ProfileType = "user" | "pet";

export async function notifyCommentToOwner(
    profileType: ProfileType,
    slug: string,
    authorName: string,
    content: string,
    userSlug?: string,
): Promise<void> {
    try {
        let ownerEmail: string | null = null;
        let profileName = slug;

        if (profileType === "user") {
            const profile = await prisma.userPublicProfile.findUnique({
                where: { slug },
                select: {
                    notifyOnComment: true,
                    user: {
                        select: { email: true, locale: true, displayName: true, username: true },
                    },
                },
            });
            if (!profile?.notifyOnComment) return;
            ownerEmail = profile.user.email;
            profileName = profile.user.displayName ?? profile.user.username;
        } else {
            if (!userSlug) return;
            // For pet profiles, check the user profile's notifyOnComment setting
            const userProfile = await prisma.userPublicProfile.findUnique({
                where: { slug: userSlug },
                select: {
                    notifyOnComment: true,
                    user: {
                        select: { email: true, locale: true, displayName: true, username: true },
                    },
                },
            });
            if (!userProfile?.notifyOnComment) return;
            ownerEmail = userProfile.user.email;

            // Get the pet name for display
            const petProfile = await prisma.publicProfile.findFirst({
                where: {
                    slug,
                    user: { userPublicProfile: { slug: userSlug } },
                },
                select: { pet: { select: { name: true } } },
            });
            profileName = petProfile?.pet?.name ?? slug;
        }

        if (!ownerEmail) return;

        const html = newCommentTemplate({ profileName, authorName, content });

        await sendMail({
            to: ownerEmail,
            subject: `[KeeperLog] New comment on ${profileName}`,
            html,
            log: { template: "new-comment" },
        });
    } catch (err) {
        console.error("[Community] Failed to send comment notification email:", err);
    }
}
