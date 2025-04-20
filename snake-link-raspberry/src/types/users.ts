import { z } from "zod";

/**
 * Zod schema & TS type for user permissions.
 */
export const UserPermissionsSchema = z.object({
    /**
     * Is the user an admin?
     * @example true
     */
    isAdmin: z.boolean(),

    /**
     * List of sensor IDs the user can view.
     * @example ["sensor1", "sensor2"]
     */
    viewSensors: z.array(z.string()),

    /**
     * List of sensor IDs the user can manage.
     * @example ["sensor1", "sensor2"]
     */
    manageSensors: z.array(z.string()),

    /**
     * Is the user allowed to view webcams?
     * @example true
     */
    viewWebcams: z.boolean(),

    /**
     * Is the user allowed to view private sensors?
     * @example true
     */
    viewPrivateSensors: z.boolean(),

    /**
     * Is the user allowed to detect new sensors?
     * @example true
     */
    detectNewSensors: z.boolean(),

    /**
     * Is the user allowed to manage users?
     * @example true
     */
    manageUsers: z.boolean(),

    /**
     * Is the user allowed to use remote access?
     * @example true
     */
    useRemoteAccess: z.boolean(),

    /**
     * Is the user allowed to manage registration keys?
     * @example true
     */
    manageRegistrationKeys: z.boolean(),

    /**
     * Is the user allowed to manage app configuration?
     * @example true
     */
    manageAppConfig: z.boolean(),
});
export type UserPermissions = z.infer<typeof UserPermissionsSchema>;

/**
 * Zod schema & TS type for a User.
 */
export const UserSchema = z.object({
    /** Unique user identifier */
    id: z.string(),

    /** The user's login name */
    username: z.string(),

    /** Hashed password */
    passwordHash: z.string(),

    /** Salt used for hashing */
    salt: z.string(),

    /** Permissions assigned to the user */
    permissions: UserPermissionsSchema,
});
export type User = z.infer<typeof UserSchema>;

/**
 * Schema for a deep-partial version of UserPermissions,
 * where any field may be omitted.
 */
const PartialUserPermissionsSchema = UserPermissionsSchema.partial();

/**
 * Schema for a deep-partial version of User,
 * allowing any subset of fields (including nested permissions).
 */
const PartialUserSchema = z.object({
    id: z.string().optional(),
    username: z.string().optional(),
    passwordHash: z.string().optional(),
    salt: z.string().optional(),
    permissions: PartialUserPermissionsSchema.optional(),
});

/**
 * Runtime guard: checks whether `input` is a valid partial of User
 * (no extra keys, correct types for any provided fields).
 *
 * @param input  Raw data to validate (e.g. JSON payload)
 * @returns      true if input is Partial<User>
 */
export function isValidPartialUser(input: unknown): input is Partial<User> {
    return PartialUserSchema.safeParse(input).success;
}
/**
 * Runtime guard: checks whether `input` is a valid partial of UserPermissions
 * (no extra keys, correct types for any provided fields).
 *
 * @param input  Raw data to validate (e.g. JSON payload)
 * @returns      true if input is Partial<UserPermissions>
 */
export function isValidPartialUserPermissions(input: unknown): input is Partial<UserPermissions> {
    return PartialUserPermissionsSchema.safeParse(input).success;
}

/**
 * Runtime guard: checks whether `input` is a valid User.
 * This is a stricter check than isValidPartialUser.
 *
 * @param input  Raw data to validate (e.g. JSON payload)
 * @returns      true if input is User
 */
export function isValidUser(input: unknown): input is User {
    return UserSchema.safeParse(input).success;
}
/**
 * Runtime guard: checks whether `input` is a valid UserPermissions.
 * This is a stricter check than isValidPartialUserPermissions.
 *
 * @param input  Raw data to validate (e.g. JSON payload)
 * @returns      true if input is UserPermissions
 */
export function isValidUserPermissions(input: unknown): input is UserPermissions {
    return UserPermissionsSchema.safeParse(input).success;
}
