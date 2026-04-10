import { prisma } from "@/config/database.js";
import { ErrorCodes, notFound } from "@/helpers/errors.js";

// ─── List Veterinarians ──────────────────────────────────────

export async function listVeterinarians(userId: string) {
    return prisma.veterinarian.findMany({
        where: { userId },
        include: {
            _count: { select: { vetVisits: true } },
        },
        orderBy: { name: "asc" },
    });
}

// ─── Get Single Veterinarian ─────────────────────────────────

export async function getVeterinarian(id: string, userId: string) {
    const vet = await prisma.veterinarian.findUnique({
        where: { id },
        include: {
            _count: { select: { vetVisits: true } },
        },
    });
    if (!vet || vet.userId !== userId) {
        throw notFound(ErrorCodes.E_VETERINARIAN_NOT_FOUND, "Veterinarian not found");
    }
    return vet;
}

// ─── Create Veterinarian ─────────────────────────────────────

export async function createVeterinarian(
    userId: string,
    data: {
        name: string;
        clinicName?: string;
        address?: string;
        phone?: string;
        email?: string;
        notes?: string;
    },
) {
    return prisma.veterinarian.create({
        data: {
            userId,
            name: data.name,
            clinicName: data.clinicName ?? null,
            address: data.address ?? null,
            phone: data.phone ?? null,
            email: data.email ?? null,
            notes: data.notes ?? null,
        },
    });
}

// ─── Update Veterinarian ─────────────────────────────────────

export async function updateVeterinarian(
    id: string,
    userId: string,
    data: {
        name?: string;
        clinicName?: string;
        address?: string;
        phone?: string;
        email?: string;
        notes?: string;
    },
) {
    const existing = await prisma.veterinarian.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_VETERINARIAN_NOT_FOUND, "Veterinarian not found");
    }

    return prisma.veterinarian.update({
        where: { id },
        data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.clinicName !== undefined ? { clinicName: data.clinicName } : {}),
            ...(data.address !== undefined ? { address: data.address } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.email !== undefined ? { email: data.email } : {}),
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
    });
}

// ─── Delete Veterinarian ─────────────────────────────────────

export async function deleteVeterinarian(id: string, userId: string) {
    const existing = await prisma.veterinarian.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
        throw notFound(ErrorCodes.E_VETERINARIAN_NOT_FOUND, "Veterinarian not found");
    }

    await prisma.veterinarian.delete({ where: { id } });
}
