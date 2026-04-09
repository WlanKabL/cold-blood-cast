import type { User } from "@cold-blood-cast/shared";
import { prisma } from "../db/client.js";

interface DbUser {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    passwordHash: string;
    salt: string;
    isAdmin: boolean;
    locale: string;
    timezone: string;
}

function toPublicUser(db: DbUser): User {
    return {
        id: db.id,
        email: db.email,
        username: db.username,
        displayName: db.displayName,
        isAdmin: db.isAdmin,
        locale: db.locale,
        timezone: db.timezone,
    };
}

export const userStore = {
    async findByUsername(
        username: string,
    ): Promise<(User & { passwordHash: string; salt: string }) | undefined> {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return undefined;
        return { ...toPublicUser(user), passwordHash: user.passwordHash, salt: user.salt };
    },

    async findByEmail(
        email: string,
    ): Promise<(User & { passwordHash: string; salt: string }) | undefined> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return undefined;
        return { ...toPublicUser(user), passwordHash: user.passwordHash, salt: user.salt };
    },

    async findById(id: string): Promise<User | undefined> {
        const user = await prisma.user.findUnique({ where: { id } });
        return user ? toPublicUser(user) : undefined;
    },

    async findByIdWithAuth(
        id: string,
    ): Promise<(User & { passwordHash: string; salt: string }) | undefined> {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return undefined;
        return { ...toPublicUser(user), passwordHash: user.passwordHash, salt: user.salt };
    },

    async create(data: {
        email: string;
        username: string;
        passwordHash: string;
        salt: string;
        displayName?: string;
        isAdmin?: boolean;
        approved?: boolean;
    }): Promise<User> {
        const created = await prisma.user.create({ data });
        return toPublicUser(created);
    },

    async deleteById(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    },
};
