import type { User } from "@cold-blood-cast/shared";

export function isAdmin(user: User | undefined): boolean {
    return user?.isAdmin === true;
}

export function requireAdmin(user: User | undefined): void {
    if (!isAdmin(user)) {
        throw new Error("Forbidden");
    }
}
