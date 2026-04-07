import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ITERATIONS = 100_000;
const KEY_LENGTH = 128;
const DIGEST = "sha512";

function hashWithPepper(password: string, salt: string, pepper: string): string {
    const derivedKey = crypto.pbkdf2Sync(password + pepper, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    return derivedKey.toString("hex");
}

async function seed(): Promise<void> {
    const pepper = process.env.PEPPER;
    if (!pepper) {
        throw new Error("PEPPER environment variable is required for seeding");
    }

    const existingAdmin = await prisma.user.findUnique({ where: { username: "admin" } });

    if (existingAdmin) {
        console.log("Admin user already exists, skipping seed.");
        return;
    }

    const salt = crypto.randomBytes(64).toString("hex");
    const passwordHash = hashWithPepper("admin", salt, pepper);

    const admin = await prisma.user.create({
        data: {
            username: "admin",
            passwordHash,
            salt,
            permissions: {
                create: {
                    isAdmin: true,
                    viewSensors: [],
                    manageSensors: [],
                    viewWebcams: true,
                    viewPrivateSensors: true,
                    detectNewSensors: true,
                    manageUsers: true,
                    manageAppConfig: true,
                    useRemoteAccess: true,
                    manageRegistrationKeys: true,
                },
            },
        },
    });

    console.log(`Seeded admin user: ${admin.username} (${admin.id})`);
    console.log("Default password is 'admin' — change it immediately!");
}

seed()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error("Seed failed:", e);
        await prisma.$disconnect();
        process.exit(1);
    });
