export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { email, message } = body;

    if (!email || !message) {
        return sendError(event, createError({ statusCode: 400, statusMessage: "Missing fields" }));
    }

    const config = useRuntimeConfig();

    const webhookUrl = config.DISCORD_WEBHOOK_URL ?? "";

    await $fetch(webhookUrl, {
        method: "POST",
        body: {
            embeds: [
                {
                    title: "📩 Neue Nachricht von deinem Cold-Blood-Cast",
                    color: 3447003,
                    fields: [
                        { name: "Absender", value: email },
                        { name: "Nachricht", value: message },
                    ],
                    timestamp: new Date().toISOString(),
                },
            ],
        },
    });

    return { success: true };
});
