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
    photos: true,
    timeline: true,
    pet_documents: true,
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

// ─── Weight Chart Fixtures ─────────────────────────────────

export const mockWeightChartSeries = [
    {
        petId: "pet_001",
        petName: "Monty",
        points: [
            { date: "2024-06-01T00:00:00.000Z", weightGrams: 200 },
            { date: "2024-07-01T00:00:00.000Z", weightGrams: 250 },
            { date: "2024-08-01T00:00:00.000Z", weightGrams: 300 },
            { date: "2024-09-01T00:00:00.000Z", weightGrams: 350 },
            { date: "2024-10-01T00:00:00.000Z", weightGrams: 400 },
            { date: "2024-11-01T00:00:00.000Z", weightGrams: 450 },
        ],
    },
    {
        petId: "pet_002",
        petName: "Slither",
        points: [
            { date: "2024-08-01T00:00:00.000Z", weightGrams: 150 },
            { date: "2024-09-01T00:00:00.000Z", weightGrams: 200 },
            { date: "2024-10-01T00:00:00.000Z", weightGrams: 250 },
            { date: "2024-11-01T00:00:00.000Z", weightGrams: 320 },
        ],
    },
];

export const mockGrowthRates = [
    {
        petId: "pet_001",
        petName: "Monty",
        firstRecord: { date: "2024-06-01T00:00:00.000Z", weightGrams: 200 },
        latestRecord: { date: "2024-11-01T00:00:00.000Z", weightGrams: 450 },
        totalGainGrams: 250,
        avgGramsPerMonth: 50,
        trend: "up" as const,
        recordCount: 6,
    },
    {
        petId: "pet_002",
        petName: "Slither",
        firstRecord: { date: "2024-08-01T00:00:00.000Z", weightGrams: 150 },
        latestRecord: { date: "2024-11-01T00:00:00.000Z", weightGrams: 320 },
        totalGainGrams: 170,
        avgGramsPerMonth: 56.67,
        trend: "up" as const,
        recordCount: 4,
    },
];

export const mockWeightRecords = [
    {
        id: "wr_001",
        petId: "pet_001",
        weightGrams: 450,
        measuredAt: "2024-11-01T00:00:00.000Z",
        notes: null,
        pet: { id: "pet_001", name: "Monty" },
    },
    {
        id: "wr_002",
        petId: "pet_001",
        weightGrams: 400,
        measuredAt: "2024-10-01T00:00:00.000Z",
        notes: null,
        pet: { id: "pet_001", name: "Monty" },
    },
    {
        id: "wr_003",
        petId: "pet_002",
        weightGrams: 320,
        measuredAt: "2024-11-01T00:00:00.000Z",
        notes: "After feeding",
        pet: { id: "pet_002", name: "Slither" },
    },
];

// ─── Shedding Analysis Fixtures ────────────────────────────

export const mockSheddingAnalysis = {
    petId: "pet_001",
    petName: "Monty",
    sheddingCount: 4,
    averageIntervalDays: 30,
    trend: "stable" as const,
    predictedNextDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    lastShedDate: new Date(Date.now() - 25 * 86400000).toISOString(),
    intervals: [
        {
            fromDate: "2024-06-01T00:00:00.000Z",
            toDate: "2024-07-01T00:00:00.000Z",
            days: 30,
        },
        {
            fromDate: "2024-07-01T00:00:00.000Z",
            toDate: "2024-08-01T00:00:00.000Z",
            days: 31,
        },
        {
            fromDate: "2024-08-01T00:00:00.000Z",
            toDate: "2024-08-30T00:00:00.000Z",
            days: 29,
        },
    ],
    isAnomaly: false,
    anomalyMessage: null,
};

export const mockSheddingAnalysisEmpty = {
    petId: "pet_002",
    petName: "Slither",
    sheddingCount: 1,
    averageIntervalDays: 0,
    trend: "stable" as const,
    predictedNextDate: null,
    lastShedDate: "2024-09-01T00:00:00.000Z",
    intervals: [],
    isAnomaly: false,
    anomalyMessage: null,
};

export const mockUpcomingSheddings = [
    {
        petId: "pet_001",
        petName: "Monty",
        predictedDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        daysUntil: 5,
        averageIntervalDays: 30,
    },
];

// ── Activity Timeline ────────────────────────────────────

export const mockTimelineEvents = {
    events: [
        {
            id: "f_001",
            type: "feeding",
            date: "2024-06-15T10:00:00.000Z",
            title: "Mouse (Small)",
            detail: null,
            icon: "lucide:utensils",
            meta: { quantity: 1, accepted: true, foodSize: "Small" },
        },
        {
            id: "s_001",
            type: "shedding",
            date: "2024-06-10T00:00:00.000Z",
            title: "Shedding (complete — good)",
            detail: "Clean one-piece shed",
            icon: "lucide:sparkles",
            meta: { complete: true, quality: "good", completedAt: "2024-06-12T00:00:00.000Z" },
        },
        {
            id: "w_001",
            type: "weight",
            date: "2024-06-05T12:00:00.000Z",
            title: "350g",
            detail: null,
            icon: "lucide:scale",
            meta: { weightGrams: 350 },
        },
        {
            id: "v_001",
            type: "vet_visit",
            date: "2024-06-01T09:00:00.000Z",
            title: "Annual checkup",
            detail: "Healthy",
            icon: "lucide:stethoscope",
            meta: { visitType: "CHECKUP", costCents: 5000, treatment: null, vetName: "Dr. Schmidt" },
        },
        {
            id: "p_001",
            type: "photo",
            date: "2024-06-20T14:00:00.000Z",
            title: "Basking",
            detail: "portrait, enclosure",
            icon: "lucide:camera",
            meta: { tags: ["portrait", "enclosure"], url: "/uploads/abc.jpg" },
        },
    ],
    total: 5,
    page: 1,
    limit: 50,
    hasMore: false,
};

export const mockTimelineEmpty = {
    events: [],
    total: 0,
    page: 1,
    limit: 50,
    hasMore: false,
};

export const mockTimelinePreview = {
    events: [
        {
            id: "f_001",
            type: "feeding",
            date: "2024-06-15T10:00:00.000Z",
            title: "Mouse (Small)",
            detail: null,
            icon: "lucide:utensils",
            meta: { quantity: 1, accepted: true, foodSize: "Small" },
        },
        {
            id: "s_001",
            type: "shedding",
            date: "2024-06-10T00:00:00.000Z",
            title: "Shedding (complete)",
            detail: null,
            icon: "lucide:sparkles",
            meta: { complete: true, quality: null, completedAt: null },
        },
    ],
    total: 15,
    page: 1,
    limit: 5,
    hasMore: true,
};

// ─── Pet Document Fixtures ─────────────────────────────────

export const mockPetDocuments = [
    {
        id: "doc_001",
        petId: "pet_001",
        userId: "usr_test_001",
        uploadId: "upl_doc_001",
        upload: { id: "upl_doc_001", url: "/uploads/uploads/cites-cert.pdf" },
        category: "CITES",
        label: "CITES Certificate 2024",
        notes: "Official CITES certificate for Monty",
        documentDate: "2024-03-15T00:00:00.000Z",
        createdAt: "2025-01-20T10:00:00.000Z",
    },
    {
        id: "doc_002",
        petId: "pet_001",
        userId: "usr_test_001",
        uploadId: "upl_doc_002",
        upload: { id: "upl_doc_002", url: "/uploads/uploads/vet-report.pdf" },
        category: "VET_REPORT",
        label: "Annual Checkup",
        notes: null,
        documentDate: "2025-02-10T00:00:00.000Z",
        createdAt: "2025-02-10T12:00:00.000Z",
    },
    {
        id: "doc_003",
        petId: "pet_001",
        userId: "usr_test_001",
        uploadId: "upl_doc_003",
        upload: { id: "upl_doc_003", url: "/uploads/uploads/receipt.pdf" },
        category: "PURCHASE_RECEIPT",
        label: null,
        notes: null,
        documentDate: null,
        createdAt: "2025-03-01T08:00:00.000Z",
    },
];
