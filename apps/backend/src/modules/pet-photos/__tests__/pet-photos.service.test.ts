import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
    pet: {
        findUnique: vi.fn(),
    },
    petPhoto: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        aggregate: vi.fn(),
    },
    $transaction: vi.fn(),
};

const mockUploadFile = vi.fn();
const mockDeleteUpload = vi.fn();

vi.mock("@/config/database.js", () => ({ prisma: mockPrisma }));
vi.mock("@/modules/uploads/uploads.service.js", () => ({
    uploadFile: mockUploadFile,
    deleteUpload: mockDeleteUpload,
}));

const {
    listPetPhotos,
    addPetPhoto,
    updatePetPhoto,
    setProfilePicture,
    deletePetPhoto,
    getProfilePicture,
    getPetPhoto,
    getSuggestedTags,
} = await import("../pet-photos.service.js");

const USER_ID = "user_123";
const PET_ID = "pet_456";
const PHOTO_ID = "photo_789";
const UPLOAD_ID = "upload_abc";

beforeEach(() => {
    vi.clearAllMocks();
});

// ─── getSuggestedTags ──────────────────────────────────

describe("getSuggestedTags", () => {
    it("returns predefined tag suggestions", () => {
        const tags = getSuggestedTags();
        expect(tags).toContain("portrait");
        expect(tags).toContain("shedding");
        expect(tags).toContain("feeding");
        expect(tags).toContain("enclosure");
        expect(tags).toContain("vet");
        expect(tags.length).toBe(5);
    });
});

// ─── listPetPhotos ─────────────────────────────────────

describe("listPetPhotos", () => {
    it("returns photos for an owned pet sorted by date", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        const photos = [
            { id: "p1", petId: PET_ID, tags: [] },
            { id: "p2", petId: PET_ID, tags: ["portrait"] },
        ];
        mockPrisma.petPhoto.findMany.mockResolvedValue(photos);

        const result = await listPetPhotos(PET_ID, USER_ID);

        expect(mockPrisma.pet.findUnique).toHaveBeenCalledWith({
            where: { id: PET_ID },
            select: { userId: true },
        });
        expect(mockPrisma.petPhoto.findMany).toHaveBeenCalledWith({
            where: { petId: PET_ID },
            include: {
                pet: { select: { userId: true } },
                upload: { select: { url: true, originalName: true } },
            },
            orderBy: { takenAt: "desc" },
        });
        expect(result).toEqual(photos);
    });

    it("filters by tag when provided", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.petPhoto.findMany.mockResolvedValue([]);

        await listPetPhotos(PET_ID, USER_ID, { tag: "portrait" });

        expect(mockPrisma.petPhoto.findMany).toHaveBeenCalledWith({
            where: { petId: PET_ID, tags: { has: "portrait" } },
            include: {
                pet: { select: { userId: true } },
                upload: { select: { url: true, originalName: true } },
            },
            orderBy: { takenAt: "desc" },
        });
    });

    it("sorts by sortOrder when sort=order", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.petPhoto.findMany.mockResolvedValue([]);

        await listPetPhotos(PET_ID, USER_ID, { sort: "order" });

        expect(mockPrisma.petPhoto.findMany).toHaveBeenCalledWith({
            where: { petId: PET_ID },
            include: {
                pet: { select: { userId: true } },
                upload: { select: { url: true, originalName: true } },
            },
            orderBy: { sortOrder: "asc" },
        });
    });

    it("throws notFound for non-owned pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(listPetPhotos(PET_ID, USER_ID)).rejects.toThrow("Pet not found");
    });

    it("throws notFound for non-existent pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue(null);

        await expect(listPetPhotos(PET_ID, USER_ID)).rejects.toThrow("Pet not found");
    });
});

// ─── getPetPhoto ───────────────────────────────────────

describe("getPetPhoto", () => {
    it("returns a photo with upload data for owned pet", async () => {
        const photo = {
            id: PHOTO_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
            upload: { url: "/uploads/uploads/abc.jpg" },
        };
        mockPrisma.petPhoto.findUnique.mockResolvedValue(photo);

        const result = await getPetPhoto(PHOTO_ID, USER_ID);

        expect(mockPrisma.petPhoto.findUnique).toHaveBeenCalledWith({
            where: { id: PHOTO_ID },
            include: {
                pet: { select: { userId: true } },
                upload: { select: { url: true, originalName: true } },
            },
        });
        expect(result).toEqual(photo);
    });

    it("throws for non-owned photo", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue({
            id: PHOTO_ID,
            pet: { userId: "other_user" },
        });

        await expect(getPetPhoto(PHOTO_ID, USER_ID)).rejects.toThrow("Photo not found");
    });

    it("throws for non-existent photo", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue(null);

        await expect(getPetPhoto(PHOTO_ID, USER_ID)).rejects.toThrow("Photo not found");
    });
});

// ─── addPetPhoto ───────────────────────────────────────

describe("addPetPhoto", () => {
    const mockFile = {} as Parameters<typeof addPetPhoto>[2];

    it("uploads file and creates photo record", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockUploadFile.mockResolvedValue({ id: UPLOAD_ID });
        mockPrisma.petPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
        const createdPhoto = {
            id: PHOTO_ID,
            petId: PET_ID,
            uploadId: UPLOAD_ID,
            caption: "My snake",
            tags: ["portrait"],
            isProfilePicture: false,
            sortOrder: 3,
        };
        mockPrisma.petPhoto.create.mockResolvedValue(createdPhoto);

        const result = await addPetPhoto(PET_ID, USER_ID, mockFile, {
            caption: "My snake",
            tags: ["portrait"],
        });

        expect(mockUploadFile).toHaveBeenCalledWith(USER_ID, mockFile, { caption: "My snake" }, undefined);
        expect(mockPrisma.petPhoto.create).toHaveBeenCalledWith({
            data: {
                petId: PET_ID,
                uploadId: UPLOAD_ID,
                caption: "My snake",
                tags: ["portrait"],
                isProfilePicture: false,
                sortOrder: 3,
                takenAt: expect.any(Date),
            },
            include: { upload: { select: { url: true, originalName: true } } },
        });
        expect(result).toEqual(createdPhoto);
    });

    it("clears previous profile picture when isProfilePicture=true", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockUploadFile.mockResolvedValue({ id: UPLOAD_ID });
        mockPrisma.petPhoto.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.petPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
        mockPrisma.petPhoto.create.mockResolvedValue({
            id: PHOTO_ID,
            isProfilePicture: true,
            sortOrder: 0,
        });

        await addPetPhoto(PET_ID, USER_ID, mockFile, { isProfilePicture: true });

        expect(mockPrisma.petPhoto.updateMany).toHaveBeenCalledWith({
            where: { petId: PET_ID, isProfilePicture: true },
            data: { isProfilePicture: false },
        });
    });

    it("starts sortOrder at 0 when no existing photos", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockUploadFile.mockResolvedValue({ id: UPLOAD_ID });
        mockPrisma.petPhoto.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
        mockPrisma.petPhoto.create.mockResolvedValue({ id: PHOTO_ID, sortOrder: 0 });

        await addPetPhoto(PET_ID, USER_ID, mockFile, {});

        expect(mockPrisma.petPhoto.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ sortOrder: 0 }),
                include: { upload: { select: { url: true, originalName: true } } },
            }),
        );
    });

    it("throws for non-owned pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(addPetPhoto(PET_ID, USER_ID, mockFile, {})).rejects.toThrow("Pet not found");
        expect(mockUploadFile).not.toHaveBeenCalled();
    });
});

// ─── updatePetPhoto ────────────────────────────────────

describe("updatePetPhoto", () => {
    it("updates caption and tags", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue({
            id: PHOTO_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
        });
        const updated = { id: PHOTO_ID, caption: "New caption", tags: ["vet"] };
        mockPrisma.petPhoto.update.mockResolvedValue(updated);

        const result = await updatePetPhoto(PHOTO_ID, USER_ID, {
            caption: "New caption",
            tags: ["vet"],
        });

        expect(mockPrisma.petPhoto.update).toHaveBeenCalledWith({
            where: { id: PHOTO_ID },
            data: { caption: "New caption", tags: ["vet"] },
            include: { upload: { select: { url: true, originalName: true } } },
        });
        expect(result).toEqual(updated);
    });

    it("updates takenAt when provided", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue({
            id: PHOTO_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
        });
        const iso = "2024-06-15T10:00:00.000Z";
        const updated = { id: PHOTO_ID, takenAt: new Date(iso) };
        mockPrisma.petPhoto.update.mockResolvedValue(updated);

        const result = await updatePetPhoto(PHOTO_ID, USER_ID, { takenAt: iso });

        expect(mockPrisma.petPhoto.update).toHaveBeenCalledWith({
            where: { id: PHOTO_ID },
            data: { takenAt: new Date(iso) },
            include: { upload: { select: { url: true, originalName: true } } },
        });
        expect(result).toEqual(updated);
    });

    it("only updates provided fields", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue({
            id: PHOTO_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
        });
        mockPrisma.petPhoto.update.mockResolvedValue({ id: PHOTO_ID });

        await updatePetPhoto(PHOTO_ID, USER_ID, { caption: "Updated" });

        expect(mockPrisma.petPhoto.update).toHaveBeenCalledWith({
            where: { id: PHOTO_ID },
            data: { caption: "Updated" },
            include: { upload: { select: { url: true, originalName: true } } },
        });
    });

    it("throws for non-owned photo", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue({
            id: PHOTO_ID,
            pet: { userId: "other_user" },
        });

        await expect(
            updatePetPhoto(PHOTO_ID, USER_ID, { caption: "x" }),
        ).rejects.toThrow("Photo not found");
    });

    it("throws for non-existent photo", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue(null);

        await expect(
            updatePetPhoto(PHOTO_ID, USER_ID, { caption: "x" }),
        ).rejects.toThrow("Photo not found");
    });
});

// ─── setProfilePicture ─────────────────────────────────

describe("setProfilePicture", () => {
    it("clears existing profile pic and sets new one", async () => {
        mockPrisma.petPhoto.findUnique
            .mockResolvedValueOnce({
                id: PHOTO_ID,
                petId: PET_ID,
                pet: { userId: USER_ID },
                upload: { url: "/uploads/uploads/test.jpg" },
            })
            .mockResolvedValueOnce({
                id: PHOTO_ID,
                isProfilePicture: true,
                upload: { url: "/uploads/uploads/test.jpg" },
            });
        mockPrisma.$transaction.mockResolvedValue([{ count: 1 }, { id: PHOTO_ID }]);

        const result = await setProfilePicture(PHOTO_ID, USER_ID);

        expect(mockPrisma.$transaction).toHaveBeenCalledWith([
            expect.anything(),
            expect.anything(),
        ]);
        expect(result).toEqual({ id: PHOTO_ID, isProfilePicture: true, upload: { url: "/uploads/uploads/test.jpg" } });
    });

    it("throws for non-owned photo", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue({
            id: PHOTO_ID,
            pet: { userId: "other_user" },
        });

        await expect(setProfilePicture(PHOTO_ID, USER_ID)).rejects.toThrow("Photo not found");
    });
});

// ─── deletePetPhoto ────────────────────────────────────

describe("deletePetPhoto", () => {
    it("deletes photo record first, then upload (avoids cascade conflict)", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue({
            id: PHOTO_ID,
            uploadId: UPLOAD_ID,
            petId: PET_ID,
            pet: { userId: USER_ID },
        });
        mockDeleteUpload.mockResolvedValue(undefined);
        mockPrisma.petPhoto.delete.mockResolvedValue({ id: PHOTO_ID });

        await deletePetPhoto(PHOTO_ID, USER_ID);

        // PetPhoto must be deleted BEFORE Upload to avoid onDelete:Cascade conflict
        expect(mockPrisma.petPhoto.delete).toHaveBeenCalledWith({
            where: { id: PHOTO_ID },
        });
        expect(mockDeleteUpload).toHaveBeenCalledWith(USER_ID, UPLOAD_ID);

        // Verify order: petPhoto.delete called first
        const deleteOrder = mockPrisma.petPhoto.delete.mock.invocationCallOrder[0];
        const uploadOrder = mockDeleteUpload.mock.invocationCallOrder[0];
        expect(deleteOrder).toBeLessThan(uploadOrder);
    });

    it("throws for non-owned photo", async () => {
        mockPrisma.petPhoto.findUnique.mockResolvedValue({
            id: PHOTO_ID,
            pet: { userId: "other_user" },
        });

        await expect(deletePetPhoto(PHOTO_ID, USER_ID)).rejects.toThrow("Photo not found");
        expect(mockDeleteUpload).not.toHaveBeenCalled();
    });
});

// ─── getProfilePicture ─────────────────────────────────

describe("getProfilePicture", () => {
    it("returns the profile picture for a pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        const profilePic = { id: PHOTO_ID, isProfilePicture: true };
        mockPrisma.petPhoto.findFirst.mockResolvedValue(profilePic);

        const result = await getProfilePicture(PET_ID, USER_ID);

        expect(mockPrisma.petPhoto.findFirst).toHaveBeenCalledWith({
            where: { petId: PET_ID, isProfilePicture: true },
            include: { upload: { select: { url: true, originalName: true } } },
        });
        expect(result).toEqual(profilePic);
    });

    it("returns null when no profile picture exists", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: USER_ID });
        mockPrisma.petPhoto.findFirst.mockResolvedValue(null);

        const result = await getProfilePicture(PET_ID, USER_ID);

        expect(result).toBeNull();
    });

    it("throws for non-owned pet", async () => {
        mockPrisma.pet.findUnique.mockResolvedValue({ userId: "other_user" });

        await expect(getProfilePicture(PET_ID, USER_ID)).rejects.toThrow("Pet not found");
    });
});
