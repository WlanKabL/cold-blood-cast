import { randomBytes } from "node:crypto";
import { mkdir, stat, unlink, readFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { resolve, join, extname } from "node:path";
import archiver from "archiver";
import { prisma } from "@/config/database.js";
import { env } from "@/config/env.js";
import { ErrorCodes, notFound, badRequest } from "@/helpers/errors.js";
import { verifyPassword } from "@/helpers/hash.js";
import { encryptFile, decryptFile } from "@/helpers/file-crypto.js";
import { sendMail, dataExportReadyTemplate } from "@/modules/mail/index.js";
import { auditLog } from "@/modules/audit/audit.service.js";

const EXPORT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const EXPORT_EXPIRY_HOURS = 48;

function getExportsDir(): string {
    return resolve(env().UPLOAD_DIR, "exports");
}

// ─── Get latest export status for user ───────────────────────

export async function getExportStatus(userId: string) {
    const latest = await prisma.dataExport.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            status: true,
            createdAt: true,
            expiresAt: true,
        },
    });

    if (!latest) return null;

    // Mark expired if past expiry
    if (latest.status === "ready" && latest.expiresAt && latest.expiresAt < new Date()) {
        await prisma.dataExport.update({
            where: { id: latest.id },
            data: { status: "expired" },
        });
        return { ...latest, status: "expired" };
    }

    return latest;
}

// ─── Request a new data export ───────────────────────────────

export async function requestDataExport(userId: string, password: string, ipAddress?: string) {
    // Verify user password
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, passwordHash: true },
    });
    if (!user) throw notFound(ErrorCodes.E_EXPORT_NOT_FOUND, "User not found");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw badRequest(ErrorCodes.E_EXPORT_FAILED, "Invalid password");

    // Cooldown check
    const recent = await prisma.dataExport.findFirst({
        where: {
            userId,
            createdAt: { gte: new Date(Date.now() - EXPORT_COOLDOWN_MS) },
            status: { in: ["pending", "processing", "ready"] },
        },
        orderBy: { createdAt: "desc" },
    });
    if (recent)
        throw badRequest(
            ErrorCodes.E_EXPORT_COOLDOWN,
            "Please wait before requesting another export",
        );

    // Create export record
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + EXPORT_EXPIRY_HOURS * 60 * 60 * 1000);

    const exportRecord = await prisma.dataExport.create({
        data: {
            userId,
            status: "processing",
            token,
            expiresAt,
        },
    });

    // Generate export data in the background
    void generateExport(exportRecord.id, userId, user.username, user.email, token);

    void auditLog(userId, "DATA_EXPORT_REQUESTED", "data_export", exportRecord.id, null, ipAddress);

    return { id: exportRecord.id, status: "processing" };
}

// ─── Read an uploaded file (encrypted or plain) ──────────────

async function readUploadedFile(url: string): Promise<Buffer | null> {
    const relPath = url.replace(/^\/uploads\//, "");
    const absPath = resolve(env().UPLOAD_DIR, relPath);
    const encPath = `${absPath}.enc`;

    try {
        const encStat = await stat(encPath).catch(() => null);
        if (encStat?.isFile()) {
            return await decryptFile(encPath);
        }
        return await readFile(absPath);
    } catch {
        return null;
    }
}

// ─── Generate the actual export ──────────────────────────────

async function generateExport(
    exportId: string,
    userId: string,
    username: string,
    email: string,
    token: string,
) {
    let zipFilePath: string | undefined;
    try {
        const [
            profile,
            enclosures,
            pets,
            sensors,
            feedings,
            sheddings,
            weightRecords,
            veterinarians,
            vetVisits,
            maintenanceTasks,
            petPhotos,
            petDocuments,
            vetVisitDocuments,
            publicProfiles,
            uploads,
        ] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    createdAt: true,
                    locale: true,
                    weeklyReportEnabled: true,
                },
            }),
            prisma.enclosure.findMany({ where: { userId } }),
            prisma.pet.findMany({ where: { userId } }),
            prisma.sensor.findMany({ where: { userId } }),
            prisma.feeding.findMany({ where: { pet: { userId } } }),
            prisma.shedding.findMany({ where: { pet: { userId } } }),
            prisma.weightRecord.findMany({ where: { pet: { userId } } }),
            prisma.veterinarian.findMany({ where: { userId } }),
            prisma.vetVisit.findMany({ where: { userId } }),
            prisma.maintenanceTask.findMany({ where: { userId } }),
            prisma.petPhoto.findMany({
                where: { pet: { userId } },
                include: { upload: { select: { url: true, originalName: true } } },
            }),
            prisma.petDocument.findMany({
                where: { userId },
                include: { upload: { select: { url: true, originalName: true } } },
            }),
            prisma.vetVisitDocument.findMany({
                where: { vetVisit: { userId } },
                include: { upload: { select: { url: true, originalName: true } } },
            }),
            prisma.publicProfile.findMany({ where: { userId } }),
            prisma.upload.findMany({
                where: { userId },
                select: { id: true, url: true, originalName: true, createdAt: true },
            }),
        ]);

        // ── Build per-entity JSON data ──────────────────────

        const entities: Record<string, unknown> = {
            "meta.json": {
                exportedAt: new Date().toISOString(),
                version: "1.0",
                user: profile,
            },
            "enclosures.json": enclosures,
            "pets.json": pets,
            "sensors.json": sensors,
            "feedings.json": feedings,
            "sheddings.json": sheddings,
            "weight-records.json": weightRecords,
            "veterinarians.json": veterinarians,
            "vet-visits.json": vetVisits,
            "maintenance-tasks.json": maintenanceTasks,
            "pet-photos.json": petPhotos.map((p) => ({
                id: p.id,
                petId: p.petId,
                caption: p.caption,
                tags: p.tags,
                isProfilePicture: p.isProfilePicture,
                takenAt: p.takenAt,
                createdAt: p.createdAt,
                fileName: p.upload?.originalName ?? null,
                exportPath: `files/pet-photos/${p.id}${extname(p.upload?.url ?? ".bin")}`,
            })),
            "pet-documents.json": petDocuments.map((d) => ({
                id: d.id,
                petId: d.petId,
                category: d.category,
                label: d.label,
                notes: d.notes,
                documentDate: d.documentDate,
                createdAt: d.createdAt,
                fileName: d.upload?.originalName ?? null,
                exportPath: `files/pet-documents/${d.id}${extname(d.upload?.url ?? ".bin")}`,
            })),
            "vet-visit-documents.json": vetVisitDocuments.map((v) => ({
                id: v.id,
                vetVisitId: v.vetVisitId,
                label: v.label,
                createdAt: v.createdAt,
                fileName: v.upload?.originalName ?? null,
                exportPath: `files/vet-documents/${v.id}${extname(v.upload?.url ?? ".bin")}`,
            })),
            "public-profiles.json": publicProfiles,
            "uploads.json": uploads,
        };

        // ── Pre-read all uploaded files ─────────────────────

        const fileBuffers: Array<{ name: string; buffer: Buffer }> = [];

        for (const photo of petPhotos) {
            if (!photo.upload?.url) continue;
            const ext = extname(photo.upload.url);
            const buffer = await readUploadedFile(photo.upload.url);
            if (buffer) {
                fileBuffers.push({ name: `files/pet-photos/${photo.id}${ext}`, buffer });
            }
        }

        for (const doc of petDocuments) {
            if (!doc.upload?.url) continue;
            const ext = extname(doc.upload.url);
            const buffer = await readUploadedFile(doc.upload.url);
            if (buffer) {
                fileBuffers.push({ name: `files/pet-documents/${doc.id}${ext}`, buffer });
            }
        }

        for (const vDoc of vetVisitDocuments) {
            if (!vDoc.upload?.url) continue;
            const ext = extname(vDoc.upload.url);
            const buffer = await readUploadedFile(vDoc.upload.url);
            if (buffer) {
                fileBuffers.push({ name: `files/vet-documents/${vDoc.id}${ext}`, buffer });
            }
        }

        // ── Create ZIP archive ──────────────────────────────

        const exportsDir = getExportsDir();
        await mkdir(exportsDir, { recursive: true });

        const zipFileName = `cbc-export_${userId}_${Date.now()}.zip`;
        zipFilePath = join(exportsDir, zipFileName);

        await new Promise<void>((resolveZip, rejectZip) => {
            const output = createWriteStream(zipFilePath!);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", () => resolveZip());
            archive.on("error", (err: Error) => rejectZip(err));

            archive.pipe(output);

            // Add per-entity JSON files
            for (const [filename, data] of Object.entries(entities)) {
                archive.append(JSON.stringify(data, null, 2), { name: filename });
            }

            // Add uploaded files
            for (const file of fileBuffers) {
                archive.append(file.buffer, { name: file.name });
            }

            void archive.finalize();
        });

        // ── Encrypt at rest ─────────────────────────────────

        try {
            await encryptFile(zipFilePath);
        } catch (encErr) {
            // Encryption failed — delete the plaintext ZIP immediately
            await unlink(zipFilePath).catch(() => {});
            throw encErr;
        }

        const fileStats = await stat(`${zipFilePath}.enc`);
        const fileSizeKb = Math.round(fileStats.size / 1024);

        await prisma.dataExport.update({
            where: { id: exportId },
            data: {
                status: "ready",
                filePath: zipFilePath,
            },
        });

        // Send notification email
        const downloadUrl = `${env().FRONTEND_URL}/export/${token}`;
        void sendMail({
            to: email,
            subject: "Your data export is ready",
            html: dataExportReadyTemplate({
                username,
                downloadUrl,
                expiresInHours: EXPORT_EXPIRY_HOURS,
                fileSizeKb,
            }),
        });
    } catch (err) {
        // Clean up any plaintext ZIP that might still be on disk
        if (zipFilePath) {
            await unlink(zipFilePath).catch(() => {});
        }
        await prisma.dataExport.update({
            where: { id: exportId },
            data: {
                status: "failed",
                error: err instanceof Error ? err.message : "Unknown error",
            },
        });
    }
}

// ─── Download export by token ────────────────────────────────

export async function downloadExport(token: string) {
    const record = await prisma.dataExport.findUnique({ where: { token } });
    if (!record) throw notFound(ErrorCodes.E_EXPORT_NOT_FOUND, "Export not found");

    if (record.status !== "ready") {
        throw badRequest(ErrorCodes.E_EXPORT_FAILED, `Export is ${record.status}`);
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
        await prisma.dataExport.update({
            where: { id: record.id },
            data: { status: "expired" },
        });
        throw badRequest(ErrorCodes.E_EXPORT_FAILED, "Export has expired");
    }

    if (!record.filePath) {
        throw badRequest(ErrorCodes.E_EXPORT_FAILED, "Export data not available");
    }

    return record.filePath;
}

// ─── Cleanup expired exports (delete files from disk) ────────

export async function cleanupExpiredExports(): Promise<number> {
    const expired = await prisma.dataExport.findMany({
        where: {
            status: "ready",
            expiresAt: { lt: new Date() },
        },
    });

    for (const exp of expired) {
        if (exp.filePath) {
            try {
                await unlink(`${exp.filePath}.enc`).catch(() => {});
                await unlink(exp.filePath).catch(() => {});
            } catch {
                // File may already be deleted
            }
        }
        await prisma.dataExport.update({
            where: { id: exp.id },
            data: { status: "expired" },
        });
    }

    return expired.length;
}
