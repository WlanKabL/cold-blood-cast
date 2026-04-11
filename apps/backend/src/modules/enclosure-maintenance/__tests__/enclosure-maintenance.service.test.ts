import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

const mockPrisma = {
    maintenanceTask: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    enclosure: {
        findUnique: vi.fn(),
    },
};

vi.mock("@/config/database.js", () => ({
    prisma: mockPrisma,
}));

vi.mock("@/helpers/errors.js", async () => {
    const actual = await vi.importActual("@/helpers/errors.js");
    return actual;
});

// ─── Import SUT ──────────────────────────────────────────────

const {
    listMaintenanceTasks,
    getMaintenanceTask,
    createMaintenanceTask,
    updateMaintenanceTask,
    completeMaintenanceTask,
    deleteMaintenanceTask,
    getOverdueTasksForUser,
} = await import("../enclosure-maintenance.service.js");

// ─── Helpers ─────────────────────────────────────────────────

const USER_ID = "user_123";
const OTHER_USER_ID = "user_other";
const TASK_ID = "task_456";
const ENCLOSURE_ID = "enc_789";

function makeTask(overrides = {}) {
    return {
        id: TASK_ID,
        enclosureId: ENCLOSURE_ID,
        userId: USER_ID,
        type: "CLEANING",
        description: "Weekly terrarium cleaning",
        completedAt: null,
        nextDueAt: new Date("2025-01-15"),
        intervalDays: 7,
        recurring: true,
        notes: null,
        createdAt: new Date("2025-01-01"),
        enclosure: { id: ENCLOSURE_ID, name: "Main Terrarium" },
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── listMaintenanceTasks ────────────────────────────────────

describe("listMaintenanceTasks", () => {
    it("returns all tasks for user", async () => {
        const tasks = [makeTask(), makeTask({ id: "task_2", type: "WATER_CHANGE" })];
        mockPrisma.maintenanceTask.findMany.mockResolvedValue(tasks);

        const result = await listMaintenanceTasks(USER_ID, {});

        expect(result).toHaveLength(2);
        expect(mockPrisma.maintenanceTask.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: USER_ID },
                orderBy: { nextDueAt: "asc" },
            }),
        );
    });

    it("filters by enclosureId", async () => {
        mockPrisma.maintenanceTask.findMany.mockResolvedValue([]);

        await listMaintenanceTasks(USER_ID, { enclosureId: ENCLOSURE_ID });

        expect(mockPrisma.maintenanceTask.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: USER_ID, enclosureId: ENCLOSURE_ID },
            }),
        );
    });

    it("filters overdue tasks", async () => {
        mockPrisma.maintenanceTask.findMany.mockResolvedValue([]);

        await listMaintenanceTasks(USER_ID, { overdue: true });

        const call = mockPrisma.maintenanceTask.findMany.mock.calls[0][0];
        expect(call.where.userId).toBe(USER_ID);
        expect(call.where.nextDueAt).toBeDefined();
        expect(call.where.completedAt).toBeNull();
    });

    it("combines enclosureId and overdue filters", async () => {
        mockPrisma.maintenanceTask.findMany.mockResolvedValue([]);

        await listMaintenanceTasks(USER_ID, {
            enclosureId: ENCLOSURE_ID,
            overdue: true,
        });

        const call = mockPrisma.maintenanceTask.findMany.mock.calls[0][0];
        expect(call.where.userId).toBe(USER_ID);
        expect(call.where.enclosureId).toBe(ENCLOSURE_ID);
        expect(call.where.completedAt).toBeNull();
    });

    it("includes enclosure select", async () => {
        mockPrisma.maintenanceTask.findMany.mockResolvedValue([]);

        await listMaintenanceTasks(USER_ID, {});

        expect(mockPrisma.maintenanceTask.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                include: { enclosure: { select: { id: true, name: true } } },
            }),
        );
    });
});

// ─── getMaintenanceTask ──────────────────────────────────────

describe("getMaintenanceTask", () => {
    it("returns task for owner", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue(makeTask());

        const result = await getMaintenanceTask(TASK_ID, USER_ID);

        expect(result.id).toBe(TASK_ID);
        expect(mockPrisma.maintenanceTask.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: TASK_ID } }),
        );
    });

    it("throws not found when task does not exist", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue(null);

        await expect(getMaintenanceTask("nonexistent", USER_ID)).rejects.toThrow(
            "Maintenance task not found",
        );
    });

    it("throws not found when task belongs to another user", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue(
            makeTask({ userId: OTHER_USER_ID }),
        );

        await expect(getMaintenanceTask(TASK_ID, USER_ID)).rejects.toThrow(
            "Maintenance task not found",
        );
    });
});

// ─── createMaintenanceTask ───────────────────────────────────

describe("createMaintenanceTask", () => {
    it("creates task with all fields", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue({ userId: USER_ID });
        const data = {
            enclosureId: ENCLOSURE_ID,
            type: "CLEANING" as const,
            description: "Deep clean",
            nextDueAt: new Date("2025-02-01"),
            intervalDays: 14,
            recurring: true,
            notes: "Use reptile-safe cleaner",
        };
        mockPrisma.maintenanceTask.create.mockResolvedValue(makeTask(data));

        const result = await createMaintenanceTask(USER_ID, data);

        expect(result.type).toBe("CLEANING");
        expect(mockPrisma.maintenanceTask.create).toHaveBeenCalledWith({
            data: {
                userId: USER_ID,
                enclosureId: ENCLOSURE_ID,
                type: "CLEANING",
                description: "Deep clean",
                nextDueAt: data.nextDueAt,
                intervalDays: 14,
                recurring: true,
                notes: "Use reptile-safe cleaner",
            },
            include: { enclosure: { select: { id: true, name: true } } },
        });
    });

    it("creates non-recurring task with defaults", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue({ userId: USER_ID });
        const data = {
            enclosureId: ENCLOSURE_ID,
            type: "LAMP_REPLACEMENT" as const,
        };
        mockPrisma.maintenanceTask.create.mockResolvedValue(makeTask(data));

        await createMaintenanceTask(USER_ID, data);

        expect(mockPrisma.maintenanceTask.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                recurring: false,
            }),
            include: expect.any(Object),
        });
    });

    it("throws not found when enclosure does not exist", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue(null);

        await expect(
            createMaintenanceTask(USER_ID, {
                enclosureId: "nonexistent",
                type: "CLEANING" as const,
            }),
        ).rejects.toThrow("Enclosure not found");
    });

    it("throws not found when enclosure belongs to another user", async () => {
        mockPrisma.enclosure.findUnique.mockResolvedValue({ userId: OTHER_USER_ID });

        await expect(
            createMaintenanceTask(USER_ID, {
                enclosureId: ENCLOSURE_ID,
                type: "CLEANING" as const,
            }),
        ).rejects.toThrow("Enclosure not found");
    });
});

// ─── updateMaintenanceTask ───────────────────────────────────

describe("updateMaintenanceTask", () => {
    it("updates task fields", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.maintenanceTask.update.mockResolvedValue(
            makeTask({ description: "Updated", intervalDays: 14 }),
        );

        const result = await updateMaintenanceTask(TASK_ID, USER_ID, {
            description: "Updated",
            intervalDays: 14,
        });

        expect(result.description).toBe("Updated");
        expect(mockPrisma.maintenanceTask.update).toHaveBeenCalledWith({
            where: { id: TASK_ID },
            data: { description: "Updated", intervalDays: 14 },
            include: { enclosure: { select: { id: true, name: true } } },
        });
    });

    it("throws not found when task does not exist", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue(null);

        await expect(
            updateMaintenanceTask("nonexistent", USER_ID, { description: "X" }),
        ).rejects.toThrow("Maintenance task not found");
    });

    it("throws not found when task belongs to another user", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue({ userId: OTHER_USER_ID });

        await expect(
            updateMaintenanceTask(TASK_ID, USER_ID, { description: "X" }),
        ).rejects.toThrow("Maintenance task not found");
    });
});

// ─── completeMaintenanceTask ─────────────────────────────────

describe("completeMaintenanceTask", () => {
    it("marks non-recurring task as completed without rescheduling", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue({
            userId: USER_ID,
            recurring: false,
            intervalDays: null,
        });
        mockPrisma.maintenanceTask.update.mockResolvedValue(
            makeTask({ completedAt: new Date(), recurring: false }),
        );

        await completeMaintenanceTask(TASK_ID, USER_ID);

        const updateCall = mockPrisma.maintenanceTask.update.mock.calls[0][0];
        expect(updateCall.data.completedAt).toBeDefined();
        expect(updateCall.data.nextDueAt).toBeUndefined();
    });

    it("marks recurring task as completed and reschedules", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue({
            userId: USER_ID,
            recurring: true,
            intervalDays: 7,
        });
        mockPrisma.maintenanceTask.update.mockResolvedValue(makeTask({ completedAt: new Date() }));

        await completeMaintenanceTask(TASK_ID, USER_ID);

        const updateCall = mockPrisma.maintenanceTask.update.mock.calls[0][0];
        expect(updateCall.data.completedAt).toBeDefined();
        expect(updateCall.data.nextDueAt).toBeDefined();

        // Verify nextDueAt is ~7 days from now
        const now = new Date();
        const nextDue = updateCall.data.nextDueAt as Date;
        const diffDays = (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeGreaterThan(6.9);
        expect(diffDays).toBeLessThan(7.1);
    });

    it("does not reschedule recurring task without intervalDays", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue({
            userId: USER_ID,
            recurring: true,
            intervalDays: null,
        });
        mockPrisma.maintenanceTask.update.mockResolvedValue(makeTask({ completedAt: new Date() }));

        await completeMaintenanceTask(TASK_ID, USER_ID);

        const updateCall = mockPrisma.maintenanceTask.update.mock.calls[0][0];
        expect(updateCall.data.completedAt).toBeDefined();
        expect(updateCall.data.nextDueAt).toBeUndefined();
    });

    it("throws not found when task does not exist", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue(null);

        await expect(completeMaintenanceTask("nonexistent", USER_ID)).rejects.toThrow(
            "Maintenance task not found",
        );
    });

    it("throws not found when task belongs to another user", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue({ userId: OTHER_USER_ID });

        await expect(completeMaintenanceTask(TASK_ID, USER_ID)).rejects.toThrow(
            "Maintenance task not found",
        );
    });
});

// ─── deleteMaintenanceTask ───────────────────────────────────

describe("deleteMaintenanceTask", () => {
    it("deletes owned task", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.maintenanceTask.delete.mockResolvedValue(makeTask());

        await deleteMaintenanceTask(TASK_ID, USER_ID);

        expect(mockPrisma.maintenanceTask.delete).toHaveBeenCalledWith({
            where: { id: TASK_ID },
        });
    });

    it("throws not found when task does not exist", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue(null);

        await expect(deleteMaintenanceTask("nonexistent", USER_ID)).rejects.toThrow(
            "Maintenance task not found",
        );
    });

    it("throws not found when task belongs to another user", async () => {
        mockPrisma.maintenanceTask.findUnique.mockResolvedValue({ userId: OTHER_USER_ID });

        await expect(deleteMaintenanceTask(TASK_ID, USER_ID)).rejects.toThrow(
            "Maintenance task not found",
        );
    });
});

// ─── getOverdueTasksForUser ──────────────────────────────────

describe("getOverdueTasksForUser", () => {
    it("returns overdue tasks (nextDueAt < now, completedAt null)", async () => {
        const overdueTasks = [
            makeTask({
                nextDueAt: new Date("2024-12-01"),
                completedAt: null,
            }),
        ];
        mockPrisma.maintenanceTask.findMany.mockResolvedValue(overdueTasks);

        const result = await getOverdueTasksForUser(USER_ID);

        expect(result).toHaveLength(1);
        const call = mockPrisma.maintenanceTask.findMany.mock.calls[0][0];
        expect(call.where.userId).toBe(USER_ID);
        expect(call.where.completedAt).toBeNull();
        expect(call.where.nextDueAt.lt).toBeDefined();
    });

    it("returns empty array when no overdue tasks", async () => {
        mockPrisma.maintenanceTask.findMany.mockResolvedValue([]);

        const result = await getOverdueTasksForUser(USER_ID);

        expect(result).toHaveLength(0);
    });
});
