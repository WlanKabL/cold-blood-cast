import { z } from "zod";

/**
 * Zod schema & TS type for user permissions.
 */
export const UserPermissionsSchema = z.object({
    isAdmin: z.boolean(),
    viewSensors: z.array(z.string()),
    manageSensors: z.array(z.string()),
    viewWebcams: z.boolean(),
    viewPrivateSensors: z.boolean(),
    detectNewSensors: z.boolean(),
    manageUsers: z.boolean(),
    useRemoteAccess: z.boolean(),
    manageRegistrationKeys: z.boolean(),
    manageAppConfig: z.boolean(),
});
export type UserPermissions = z.infer<typeof UserPermissionsSchema>;

/**
 * Zod schema & TS type for a User.
 */
export const UserSchema = z.object({
    id: z.string(),
    username: z.string(),
    passwordHash: z.string(),
    salt: z.string(),
    permissions: UserPermissionsSchema,
});
export type User = z.infer<typeof UserSchema>;

const PartialUserPermissionsSchema = UserPermissionsSchema.partial();

const PartialUserSchema = z.object({
    id: z.string().optional(),
    username: z.string().optional(),
    passwordHash: z.string().optional(),
    salt: z.string().optional(),
    permissions: PartialUserPermissionsSchema.optional(),
});

export function isValidPartialUser(input: unknown): input is Partial<User> {
    return PartialUserSchema.safeParse(input).success;
}

export function isValidPartialUserPermissions(input: unknown): input is Partial<UserPermissions> {
    return PartialUserPermissionsSchema.safeParse(input).success;
}

export function isValidUser(input: unknown): input is User {
    return UserSchema.safeParse(input).success;
}

export function isValidUserPermissions(input: unknown): input is UserPermissions {
    return UserPermissionsSchema.safeParse(input).success;
}
