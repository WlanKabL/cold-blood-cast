import { User, UserPermissions } from "../types/users.js";

export function isAdmin(user: User): boolean {
    return hasPermission(user, "isAdmin");
}

export function hasPermission<K extends keyof UserPermissions>(
    user: User | undefined,
    permission: K,
    sensorId?: string,
): boolean {
    if (!user) return false;

    if (user.permissions.isAdmin) return true;

    const value = user.permissions?.[permission];
    if (value === true) return true;
    if (Array.isArray(value)) return sensorId ? value.includes(sensorId) : false;

    return false;
}
