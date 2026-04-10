/**
 * E2E Test Fixtures — Mock data for all Playwright tests.
 *
 * Every fixture mirrors the real API response shapes from the backend.
 * Features are Record<string, boolean> matching AuthMeResponse.
 */

// ─── Feature Sets ──────────────────────────────────────────

const ALL_FEATURES: Record<string, boolean> = {
    dashboard: true,
    enclosures: true,
    pets: true,
    sensors: true,
    feedings: true,
    sheddings: true,
    weights: true,
    vet_visits: true,
    api_access: true,
};

// ─── User Fixtures ─────────────────────────────────────────

export interface MockMeResponse {
    user: {
        id: string;
        username: string;
        email: string;
        displayName: string | null;
        avatarUrl: string | null;
        createdAt: string;
        emailVerified: boolean;
        onboardingCompleted: boolean;
        locale: string;
    };
    roles: string[];
    features: Record<string, boolean>;
    limits: Record<string, number>;
    enabledFlags: string[];
    featureTiers: Record<string, { role: string; displayName: string; color: string; priority: number }[]>;
    impersonatedBy: string | null;
}

function createUser(overrides: Partial<MockMeResponse["user"]> = {}): MockMeResponse["user"] {
    return {
        id: "usr_test_001",
        username: "testkeeper",
        email: "test@coldbloodcast.local",
        displayName: "Test Keeper",
        avatarUrl: null,
        createdAt: "2025-01-15T10:00:00.000Z",
        emailVerified: true,
        onboardingCompleted: true,
        locale: "en",
        ...overrides,
    };
}

function createMeResponse(overrides: Partial<MockMeResponse> = {}): MockMeResponse {
    return {
        user: createUser(overrides.user),
        roles: overrides.roles ?? ["FREE"],
        features: overrides.features ?? ALL_FEATURES,
        limits: overrides.limits ?? {},
        enabledFlags: overrides.enabledFlags ?? Object.keys(ALL_FEATURES),
        featureTiers: overrides.featureTiers ?? {},
        impersonatedBy: overrides.impersonatedBy ?? null,
    };
}

export const defaultUser: MockMeResponse = createMeResponse();

export const adminUser: MockMeResponse = createMeResponse({
    user: createUser({
        id: "usr_admin_001",
        username: "admin",
        email: "admin@coldbloodcast.local",
        displayName: "Admin",
    }),
    roles: ["ADMIN"],
});

export const unverifiedUser: MockMeResponse = createMeResponse({
    user: createUser({
        id: "usr_unverified_001",
        emailVerified: false,
    }),
});

// ─── Pet Fixtures ──────────────────────────────────────────

export const mockPets = [
    {
        id: "pet_001",
        userId: "usr_test_001",
        name: "Monty",
        species: "corn_snake",
        morph: "Amel",
        gender: "MALE",
        birthDate: "2022-03-10",
        weight: 450,
        enclosureId: "enc_001",
        enclosure: { id: "enc_001", name: "Main Vivarium" },
        notes: null,
        photos: [],
        _count: { feedings: 12, sheddings: 3, weightRecords: 8, photos: 2 },
        createdAt: "2025-01-15T10:00:00.000Z",
        updatedAt: "2025-01-15T10:00:00.000Z",
    },
    {
        id: "pet_002",
        userId: "usr_test_001",
        name: "Slither",
        species: "corn_snake",
        morph: "Normal",
        gender: "FEMALE",
        birthDate: "2023-06-20",
        weight: 320,
        enclosureId: "enc_001",
        enclosure: { id: "enc_001", name: "Main Vivarium" },
        notes: "Very friendly",
        photos: [],
        _count: { feedings: 5, sheddings: 1, weightRecords: 3, photos: 0 },
        createdAt: "2025-02-01T10:00:00.000Z",
        updatedAt: "2025-02-01T10:00:00.000Z",
    },
];

// ─── Veterinarian Fixtures ─────────────────────────────────

export const mockVeterinarians = [
    {
        id: "vet_001",
        userId: "usr_test_001",
        name: "Dr. Schmidt",
        clinicName: "Reptile Clinic Berlin",
        address: "Berliner Str. 123",
        phone: "+49 30 1234567",
        email: "info@reptileclinic.de",
        notes: null,
        createdAt: "2025-01-15T10:00:00.000Z",
    },
    {
        id: "vet_002",
        userId: "usr_test_001",
        name: "Dr. Müller",
        clinicName: null,
        address: null,
        phone: null,
        email: null,
        notes: "House calls only",
        createdAt: "2025-02-10T10:00:00.000Z",
    },
];

// ─── Vet Visit Fixtures ────────────────────────────────────

export const mockVetVisits = [
    {
        id: "visit_001",
        userId: "usr_test_001",
        petId: "pet_001",
        veterinarianId: "vet_001",
        sourceVisitId: null,
        visitDate: "2025-06-15T00:00:00.000Z",
        visitType: "CHECKUP",
        isAppointment: false,
        reason: "Annual checkup",
        diagnosis: "Healthy, no issues found",
        treatment: null,
        costCents: 5000,
        weightGrams: 450,
        nextAppointment: "2026-06-15T00:00:00.000Z",
        notes: "All good, come back next year",
        createdAt: "2025-06-15T10:00:00.000Z",
        updatedAt: "2025-06-15T10:00:00.000Z",
        pet: { id: "pet_001", name: "Monty", species: "corn_snake" },
        veterinarian: { id: "vet_001", name: "Dr. Schmidt", clinicName: "Reptile Clinic Berlin" },
        sourceVisit: null,
        documents: [],
    },
    {
        id: "visit_002",
        userId: "usr_test_001",
        petId: "pet_002",
        veterinarianId: "vet_001",
        sourceVisitId: null,
        visitDate: "2025-08-20T00:00:00.000Z",
        visitType: "FECAL_TEST",
        isAppointment: false,
        reason: "Routine fecal test",
        diagnosis: "No parasites detected",
        treatment: null,
        costCents: 3500,
        weightGrams: 320,
        nextAppointment: null,
        notes: null,
        createdAt: "2025-08-20T10:00:00.000Z",
        updatedAt: "2025-08-20T10:00:00.000Z",
        pet: { id: "pet_002", name: "Slither", species: "corn_snake" },
        veterinarian: { id: "vet_001", name: "Dr. Schmidt", clinicName: "Reptile Clinic Berlin" },
        sourceVisit: null,
        documents: [{ id: "doc_001", uploadId: "upl_001", label: "Lab results", upload: { id: "upl_001", url: "/uploads/vetDocs/lab.pdf" } }],
    },
    {
        id: "visit_003",
        userId: "usr_test_001",
        petId: "pet_001",
        veterinarianId: "vet_001",
        sourceVisitId: null,
        visitDate: "2026-07-01T14:00:00.000Z",
        visitType: "CHECKUP",
        isAppointment: true,
        reason: "Follow-up checkup",
        diagnosis: null,
        treatment: null,
        costCents: null,
        weightGrams: null,
        nextAppointment: null,
        notes: null,
        createdAt: "2025-06-15T10:00:00.000Z",
        updatedAt: "2025-06-15T10:00:00.000Z",
        pet: { id: "pet_001", name: "Monty", species: "corn_snake" },
        veterinarian: { id: "vet_001", name: "Dr. Schmidt", clinicName: "Reptile Clinic Berlin" },
        sourceVisit: null,
        documents: [],
    },
];

// ─── Vet Visit Detail Fixture (with followUps) ────────────

export const mockVetVisitDetail = {
    ...mockVetVisits[0],
    followUps: [
        {
            id: "visit_003",
            visitDate: "2026-07-01T14:00:00.000Z",
            visitType: "CHECKUP",
            isAppointment: true,
            reason: "Follow-up checkup",
        },
    ],
};

// ─── Vet Visit Documents ───────────────────────────────────

export const mockVetVisitDocuments = [
    {
        id: "doc_001",
        vetVisitId: "visit_002",
        uploadId: "upl_001",
        label: "Lab results",
        createdAt: "2025-08-20T10:00:00.000Z",
        upload: { id: "upl_001", url: "/uploads/vetDocs/lab-results.pdf" },
    },
    {
        id: "doc_002",
        vetVisitId: "visit_002",
        uploadId: "upl_002",
        label: "X-Ray photo",
        createdAt: "2025-08-20T11:00:00.000Z",
        upload: { id: "upl_002", url: "/uploads/vetDocs/xray.jpg" },
    },
];

// ─── Vet Costs ─────────────────────────────────────────────

export const mockVetCosts = {
    totalCents: 8500,
    visitCount: 2,
    byPet: [
        { petId: "pet_001", petName: "Monty", totalCents: 5000, visitCount: 1 },
        { petId: "pet_002", petName: "Slither", totalCents: 3500, visitCount: 1 },
    ],
};

// ─── Upcoming Appointments ─────────────────────────────────

export const mockUpcomingAppointments = [
    {
        ...mockVetVisits[2],
        _sortDate: "2026-07-01T14:00:00.000Z",
    },
];

// ─── Enclosure Fixtures ────────────────────────────────────

export const mockEnclosures = [
    {
        id: "enc_001",
        userId: "usr_test_001",
        name: "Main Vivarium",
        type: "TERRARIUM",
        species: "corn_snake",
        description: "Primary enclosure for corn snakes",
        imageUrl: null,
        lengthCm: 120,
        widthCm: 60,
        heightCm: 60,
        room: "Living Room",
        active: true,
        createdAt: "2025-01-15T10:00:00.000Z",
        _count: { pets: 2, sensors: 1 },
    },
    {
        id: "enc_002",
        userId: "usr_test_001",
        name: "Quarantine Box",
        type: "RACK",
        species: null,
        description: null,
        imageUrl: null,
        lengthCm: null,
        widthCm: null,
        heightCm: null,
        room: null,
        active: false,
        createdAt: "2025-03-01T10:00:00.000Z",
        _count: { pets: 0, sensors: 0 },
    },
];

// ─── Sensor Fixtures ───────────────────────────────────────

export const mockSensors = [
    {
        id: "sensor_001",
        userId: "usr_test_001",
        name: "Hot Side Temp",
        type: "TEMPERATURE",
        unit: "°C",
        active: true,
        enclosureId: "enc_001",
        enclosure: { id: "enc_001", name: "Main Vivarium" },
        createdAt: "2025-01-20T10:00:00.000Z",
    },
    {
        id: "sensor_002",
        userId: "usr_test_001",
        name: "Humidity Sensor",
        type: "HUMIDITY",
        unit: "%",
        active: true,
        enclosureId: "enc_001",
        enclosure: { id: "enc_001", name: "Main Vivarium" },
        createdAt: "2025-01-20T11:00:00.000Z",
    },
    {
        id: "sensor_003",
        userId: "usr_test_001",
        name: "Old Pressure",
        type: "PRESSURE",
        unit: "hPa",
        active: false,
        enclosureId: null,
        enclosure: null,
        createdAt: "2025-02-01T10:00:00.000Z",
    },
];

// ─── Dashboard Fixtures ────────────────────────────────────

export const mockFeedings = [
    { id: "feeding_001", petId: "pet_001", fedAt: "2025-09-10T10:00:00.000Z" },
    { id: "feeding_002", petId: "pet_002", fedAt: "2025-09-08T10:00:00.000Z" },
];
export const mockFeedingReminders: unknown[] = [];
export const mockAnnouncements: unknown[] = [];

// ─── Pet Photo Fixtures ────────────────────────────────────

export const mockPetPhotos = [
    {
        id: "photo_001",
        petId: "pet_001",
        uploadId: "upl_photo_001",
        caption: "Monty after shedding",
        tags: ["portrait", "shedding"],
        isProfilePicture: true,
        sortOrder: 0,
        takenAt: "2025-03-15T10:00:00.000Z",
        createdAt: "2025-03-15T10:00:00.000Z",
        pet: { userId: "usr_test_001" },
        upload: { url: "/uploads/uploads/monty-shed.jpg" },
    },
    {
        id: "photo_002",
        petId: "pet_001",
        uploadId: "upl_photo_002",
        caption: "Feeding time",
        tags: ["feeding"],
        isProfilePicture: false,
        sortOrder: 1,
        takenAt: "2025-04-01T12:00:00.000Z",
        createdAt: "2025-04-01T12:00:00.000Z",
        pet: { userId: "usr_test_001" },
        upload: { url: "/uploads/uploads/monty-feeding.jpg" },
    },
];
