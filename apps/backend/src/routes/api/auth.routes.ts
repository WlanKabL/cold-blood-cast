import { Router, Request, NextFunction } from "express";
import crypto from "crypto";
import { userStore } from "../../stores/userStore.js";
import type { User } from "@cold-blood-cast/shared";
import { DataStorageService } from "../../storage/dataStorageService.js";
import { hasPermission } from "../../utils/permissions.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { verifyPassword, generateSalt, hashPassword } from "../../helpers/hash.js";
import {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
    REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_OPTIONS,
} from "../../helpers/jwt.js";
import { badRequest, unauthorized, forbidden } from "../../helpers/errors.js";

const router = Router();
const dataStore = new DataStorageService("./data");
const regKeyStore = dataStore.getRegistrationKeysStore();

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
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", async (req: Request, res: any, next: NextFunction) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            throw badRequest("Username and password are required");
        }

        const user = await userStore.findByUsername(username);
        if (!user) throw unauthorized("Invalid credentials");

        const valid = verifyPassword(password, user.salt, user.passwordHash);
        if (!valid) throw unauthorized("Invalid credentials");

        const accessToken = signAccessToken(user);
        const { token: refreshToken } = signRefreshToken(user);

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
        res.json({ accessToken });
    } catch (err) {
        next(err);
    }
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
router.post("/register", async (req: Request, res: any, next: NextFunction) => {
    try {
        const { username, password, key } = req.body;

        if (!username || !password || !key) {
            throw badRequest("Username, password, and registration key are required");
        }

        const keys = regKeyStore.load();
        const keyIndex = keys.indexOf(key);
        if (keyIndex === -1) throw unauthorized("Invalid registration key");

        const existing = await userStore.findByUsername(username);
        if (existing) {
            throw badRequest("Username already exists");
        }

        keys.splice(keyIndex, 1);
        regKeyStore.save(keys);

        const salt = generateSalt();
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

        await userStore.add(newUser);

        const accessToken = signAccessToken(newUser);
        const { token: refreshToken } = signRefreshToken(newUser);

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(201).json({ accessToken });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh access token using refresh cookie
 *     responses:
 *       200:
 *         description: New access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid or missing refresh token
 */
router.post("/refresh", async (req: Request, res: any, next: NextFunction) => {
    try {
        const token = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!token) throw unauthorized("No refresh token");

        const payload = verifyRefreshToken(token);
        const user = await userStore.findById(payload.userId);
        if (!user) throw unauthorized("User not found");

        const accessToken = signAccessToken(user);
        const { token: newRefreshToken } = signRefreshToken(user);

        res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);
        res.json({ accessToken });
    } catch (err) {
        next(err);
    }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout (clear refresh cookie)
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post("/logout", (_req: Request, res: any) => {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.json({ message: "Logged out" });
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current user info
 *     responses:
 *       200:
 *         description: Current user
 */
router.get("/me", authMiddleware, (req: Request, res: any) => {
    const user = req.user!;
    res.json({
        id: user.id,
        username: user.username,
        permissions: user.permissions,
    });
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
        if (!hasPermission(user, "manageRegistrationKeys")) {
            throw forbidden();
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
            if (!hasPermission(user, "manageRegistrationKeys")) {
                throw forbidden();
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
        if (!hasPermission(user, "manageRegistrationKeys")) {
            throw forbidden();
        }

        const keys = regKeyStore.load([]);
        res.json({ keys });
    } catch (err) {
        next(err);
    }
});

export default router;
