import { z } from "zod";

export const createApiKeySchema = z.object({
    name: z.string().min(1).max(100),
    scopes: z
        .array(z.enum(["read", "write", "enclosures", "sensors", "alerts"]))
        .min(1)
        .default(["read"]),
    expiresInDays: z.number().int().min(1).max(365).optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
