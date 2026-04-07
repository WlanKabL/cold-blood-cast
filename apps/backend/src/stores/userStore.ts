import type { User, UserPermissions } from "@cold-blood-cast/shared";
import { prisma } from "../db/client.js";

function toSharedUser(dbUser: {
    id: string;
    username: string;
    passwordHash: string;
    salt: string;
    permissions: {
        isAdmin: boolean;
        viewSensors: string[];
        manageSensors: string[];
        viewWebcams: boolean;
        viewPrivateSensors: boolean;
        detectNewSensors: boolean;
        manageUsers: boolean;
        manageAppConfig: boolean;
        useRemoteAccess: boolean;
        manageRegistrationKeys: boolean;
    } | null;
}): User {
    return {
        id: dbUser.id,
        username: dbUser.username,
        passwordHash: dbUser.passwordHash,
        salt: dbUser.salt,
        permissions: dbUser.permissions
            ? {
                  isAdmin: dbUser.permissions.isAdmin,
                  viewSensors: dbUser.permissions.viewSensors,
                  manageSensors: dbUser.permissions.manageSensors,
                  viewWebcams: dbUser.permissions.viewWebcams,
                  viewPrivateSensors: dbUser.permissions.viewPrivateSensors,
                  detectNewSensors: dbUser.permissions.detectNewSensors,
                  manageUsers: dbUser.permissions.manageUsers,
                  manageAppConfig: dbUser.permissions.manageAppConfig,
                  useRemoteAccess: dbUser.permissions.useRemoteAccess,
                  manageRegistrationKeys: dbUser.permissions.manageRegistrationKeys,
              }
            : {
                  isAdmin: false,
                  viewSensors: [],
                  manageSensors: [],
                  viewWebcams: false,
                  viewPrivateSensors: false,
                  detectNewSensors: false,
                  manageUsers: false,
                  manageAppConfig: false,
                  useRemoteAccess: false,
                  manageRegistrationKeys: false,
              },
    };
}

export const userStore = {
    async getAll(): Promise<User[]> {
        const users = await prisma.user.findMany({ include: { permissions: true } });
        return users.map(toSharedUser);
    },

    async findByUsername(username: string): Promise<User | undefined> {
        const user = await prisma.user.findUnique({
            where: { username },
            include: { permissions: true },
        });
        return user ? toSharedUser(user) : undefined;
    },

    async findById(id: string): Promise<User | undefined> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: { permissions: true },
        });
        return user ? toSharedUser(user) : undefined;
    },

    async add(user: User): Promise<User> {
        const created = await prisma.user.create({
            data: {
                id: user.id,
                username: user.username,
                passwordHash: user.passwordHash,
                salt: user.salt,
                permissions: {
                    create: {
                        isAdmin: user.permissions.isAdmin,
                        viewSensors: user.permissions.viewSensors,
                        manageSensors: user.permissions.manageSensors,
                        viewWebcams: user.permissions.viewWebcams,
                        viewPrivateSensors: user.permissions.viewPrivateSensors,
                        detectNewSensors: user.permissions.detectNewSensors,
                        manageUsers: user.permissions.manageUsers,
                        manageAppConfig: user.permissions.manageAppConfig,
                        useRemoteAccess: user.permissions.useRemoteAccess,
                        manageRegistrationKeys: user.permissions.manageRegistrationKeys,
                    },
                },
            },
            include: { permissions: true },
        });
        return toSharedUser(created);
    },

    async updatePermissions(userId: string, permissions: Partial<UserPermissions>): Promise<void> {
        await prisma.userPermissions.upsert({
            where: { userId },
            update: permissions,
            create: { userId, ...permissions } as Parameters<
                typeof prisma.userPermissions.create
            >[0]["data"],
        });
    },

    async deleteById(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    },
};
