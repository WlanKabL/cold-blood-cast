import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { userStore } from "../../stores/userStore.js";
import { User } from "../../types/users.js";
import { validateEnv } from "../../config.js";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { hasPermission } from "../../utils/permissions.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();
const dataStore = new DataStorageService("./data");
const regKeyStore = dataStore.getRegistrationKeysStore();

/**
 * Derives a hashed password using PBKDF2 with a secret pepper.
 *
 * Combines the plaintext password and a master pepper from the environment,
 * then runs PBKDF2 with SHA‑512, 100 000 iterations, and a 128‑byte key length.
 *
 * @param password  The user's plaintext password
 * @param salt      A unique, per-user salt (must be stored alongside the hash)
 * @returns         Hex‑encoded derived key (256 hex characters for 128 bytes)
 * @throws          If PEPPER is missing in the environment
 */
export function hashPassword(password: string, salt: string): string {
    const env = validateEnv(process.env);
    const { PEPPER } = env;
    if (!PEPPER) {
        throw new Error("Environment variable PEPPER is required for password hashing");
    }

    const derivedKey = crypto.pbkdf2Sync(
        /* password+pepper */ password + PEPPER,
        /* salt */ salt,
        /* iterations */ 100_000,
        /* key length */ 128,
        /* digest */ "sha512",
    );

    return derivedKey.toString("hex");
}

function generateToken(user: User): string {
    const env = validateEnv(process.env);
    return jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: "7d" });
}

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: wlankabl
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", (req: Request, res: any) => {
    const { username, password } = req.body;
    const user = userStore.findByUsername(username);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const hash = hashPassword(password, user.salt);
    if (hash !== user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ token });
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register user with a registration key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - key
 *             properties:
 *               username:
 *                 type: string
 *                 example: username123
 *               password:
 *                 type: string
 *                 example: secret123
 *               key:
 *                 type: string
 *                 example: 12345678abcdefg
 */
router.post("/register", (req: Request, res: any) => {
    const { username, password, key } = req.body;

    const keys = regKeyStore.load();
    const keyIndex = keys.indexOf(key);
    if (keyIndex === -1) return res.status(404).json({ error: "Not found" });

    if (userStore.findByUsername(username)) {
        return res.status(400).json({ error: "Username already exists" });
    }

    // remove used key
    keys.splice(keyIndex, 1);
    regKeyStore.save(keys);

    const salt = crypto.randomBytes(64).toString("hex");
    const passwordHash = hashPassword(password, salt);

    const newUser: User = {
        id: crypto.randomUUID(),
        username,
        salt,
        passwordHash,
        permissions: {
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

    userStore.add(newUser);

    const token = generateToken(newUser);
    res.status(201).json({ token });
});

/**
 * @openapi
 * /api/auth/registration-key:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Generate a new registration key
 *     responses:
 *       200:
 *         description: Successful key generation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 key:
 *                   type: string
 *                   description: New registration key
 */
router.post("/registration-key", authMiddleware, (req: Request, res: any, next: NextFunction) => {
    try {
        const user = req.user!;

        const allowed = hasPermission(user, "manageRegistrationKeys");

        if (!allowed) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const keys = regKeyStore.load([]);
        const newKey = crypto.randomBytes(8).toString("hex");
        keys.push(newKey);
        regKeyStore.save(keys);

        res.json({ key: newKey });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/auth/registration-key/{key}:
 *   delete:
 *     tags:
 *       - Auth
 *     summary: Delete a registration key
 *     parameters:
 *       - name: key
 *         in: path
 *         required: true
 *         description: Registration key to delete
 *         schema:
 *           type: string
 */
router.delete(
    "/registration-key/:key",
    authMiddleware,
    (req: Request, res: any, next: NextFunction) => {
        try {
            const user = req.user!;

            const allowed = hasPermission(user, "manageRegistrationKeys");

            if (!allowed) {
                return res.status(403).json({ error: "Forbidden" });
            }

            const keys = regKeyStore.load([]);
            const updated = keys.filter((k) => k !== req.params.key);
            regKeyStore.save(updated);
            res.status(204).send();
        } catch (err) {
            next(err);
        }
    },
);

/**
 * @openapi
 * /api/auth/registration-keys:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get all registration keys
 *     responses:
 *       200:
 *         description: List of registration keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get("/registration-keys", authMiddleware, (req: Request, res: any, next: NextFunction) => {
    try {
        const user = req.user!;

        const allowed = hasPermission(user, "manageRegistrationKeys");

        if (!allowed) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const keys = regKeyStore.load([]);
        res.json({ keys });
    } catch (err) {
        next(err);
    }
});

export default router;
