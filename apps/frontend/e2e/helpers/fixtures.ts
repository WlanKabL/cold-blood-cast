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
    enclosure_maintenance: true,
    weekly_planner: true,
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
        weeklyReportEnabled?: boolean;
    };
    roles: string[];
    features: Record<string, boolean>;
    limits: Record<string, number>;
    enabledFlags: string[];
    featureTiers: Record<
        string,
        { role: string; displayName: string; color: string; priority: number }[]
    >;
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
        feedingIntervalMinDays: 7,
        feedingIntervalMaxDays: 14,
        photos: [
            {
                id: "photo_001",
                uploadId: "upl_photo_001",
                upload: { url: "/uploads/uploads/monty-shed.jpg" },
            },
        ],
        _count: { feedings: 12, sheddings: 3, weightRecords: 8, photos: 2, documents: 3 },
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
        feedingIntervalMinDays: null,
        feedingIntervalMaxDays: null,
        photos: [],
        _count: { feedings: 5, sheddings: 1, weightRecords: 3, photos: 0, documents: 0 },
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
        documents: [
            {
                id: "doc_001",
                uploadId: "upl_001",
                label: "Lab results",
                upload: { id: "upl_001", url: "/uploads/vetDocs/lab.pdf" },
            },
        ],
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

export const mockPetDetailFeedings = [
    {
        id: "feeding_010",
        petId: "pet_001",
        foodType: "Mouse",
        foodSize: "Small",
        quantity: 1,
        accepted: true,
        fedAt: "2025-09-10T10:00:00.000Z",
        notes: null,
    },
    {
        id: "feeding_011",
        petId: "pet_001",
        foodType: "Mouse",
        foodSize: "Medium",
        quantity: 1,
        accepted: true,
        fedAt: "2025-09-03T10:00:00.000Z",
        notes: null,
    },
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
            meta: {
                visitType: "CHECKUP",
                costCents: 5000,
                treatment: null,
                vetName: "Dr. Schmidt",
            },
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

// ─── Maintenance Task Fixtures ─────────────────────────────

export const mockMaintenanceTasks = [
    {
        id: "mt_001",
        enclosureId: "enc_001",
        userId: "usr_test_001",
        type: "CLEANING",
        description: "Full terrarium cleaning",
        completedAt: null,
        nextDueAt: "2026-04-05T00:00:00.000Z",
        intervalDays: 14,
        recurring: true,
        notes: "Use reptile-safe disinfectant",
        createdAt: "2026-03-01T10:00:00.000Z",
        enclosure: { id: "enc_001", name: "Desert Terrarium" },
    },
    {
        id: "mt_002",
        enclosureId: "enc_001",
        userId: "usr_test_001",
        type: "SUBSTRATE_CHANGE",
        description: "Replace aspen bedding",
        completedAt: null,
        nextDueAt: "2026-04-20T00:00:00.000Z",
        intervalDays: 30,
        recurring: true,
        notes: null,
        createdAt: "2026-03-15T08:00:00.000Z",
        enclosure: { id: "enc_001", name: "Desert Terrarium" },
    },
    {
        id: "mt_003",
        enclosureId: "enc_001",
        userId: "usr_test_001",
        type: "WATER_CHANGE",
        description: "Clean and refill water bowl",
        completedAt: "2026-04-10T09:00:00.000Z",
        nextDueAt: "2026-04-13T00:00:00.000Z",
        intervalDays: 3,
        recurring: true,
        notes: null,
        createdAt: "2026-03-01T10:00:00.000Z",
        enclosure: { id: "enc_001", name: "Desert Terrarium" },
    },
    {
        id: "mt_004",
        enclosureId: "enc_001",
        userId: "usr_test_001",
        type: "LAMP_REPLACEMENT",
        description: "Replace UVB bulb",
        completedAt: null,
        nextDueAt: "2026-06-01T00:00:00.000Z",
        intervalDays: null,
        recurring: false,
        notes: "Arcadia T5 12%",
        createdAt: "2026-01-01T10:00:00.000Z",
        enclosure: { id: "enc_001", name: "Desert Terrarium" },
    },
];

export const mockOverdueMaintenanceTasks = [mockMaintenanceTasks[0]];

export const mockMaintenanceEmpty: never[] = [];

// ─── Public Profile Fixtures ───────────────────────────────

export const mockPublicProfile = {
    id: "pp_001",
    petId: "pet_001",
    userId: "usr_test_001",
    slug: "monty-the-snake",
    active: true,
    bio: "A friendly corn snake who loves to explore",
    showPhotos: true,
    showWeight: true,
    showAge: true,
    showFeedings: true,
    showSheddings: true,
    showSpecies: true,
    showMorph: true,
    views: 42,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-03-15T10:00:00.000Z",
};

export const mockPublicProfileInactive = {
    ...mockPublicProfile,
    id: "pp_002",
    active: false,
    views: 0,
};

export const mockPublicPetData = {
    name: "Monty",
    bio: "A friendly corn snake who loves to explore",
    species: "Corn Snake",
    morph: "Amel",
    gender: "MALE",
    birthDate: "2022-03-10T00:00:00.000Z",
    acquisitionDate: "2022-05-01T00:00:00.000Z",
    profilePhotoId: "photo_001",
    photos: [
        {
            id: "photo_001",
            caption: "Profile picture",
            tags: ["portrait"],
            isProfilePicture: true,
            takenAt: "2025-06-01T10:00:00.000Z",
        },
        {
            id: "photo_002",
            caption: "Feeding time",
            tags: ["feeding"],
            isProfilePicture: false,
            takenAt: "2025-08-15T10:00:00.000Z",
        },
    ],
    feedings: [
        {
            feedItem: "Mouse",
            foodType: "MOUSE",
            foodSize: "Adult",
            quantity: 1,
            accepted: true,
            fedAt: "2026-03-01T10:00:00.000Z",
            notes: null,
        },
        {
            feedItem: "Mouse",
            foodType: "MOUSE",
            foodSize: "Small",
            quantity: 2,
            accepted: true,
            fedAt: "2026-02-15T10:00:00.000Z",
            notes: null,
        },
        {
            feedItem: "Rat",
            foodType: "RAT",
            foodSize: "Pinky",
            quantity: 1,
            accepted: false,
            fedAt: "2026-02-01T10:00:00.000Z",
            notes: "Refused feeding",
        },
    ],
    sheddings: [
        {
            startedAt: "2026-02-20T00:00:00.000Z",
            completedAt: "2026-02-24T00:00:00.000Z",
            complete: true,
            quality: "complete",
            notes: null,
        },
        {
            startedAt: "2026-01-15T00:00:00.000Z",
            completedAt: null,
            complete: false,
            quality: null,
            notes: "In blue phase",
        },
    ],
    weightRecords: [
        { weightGrams: 450, measuredAt: "2026-03-01T00:00:00.000Z" },
        { weightGrams: 430, measuredAt: "2026-02-01T00:00:00.000Z" },
        { weightGrams: 410, measuredAt: "2026-01-01T00:00:00.000Z" },
    ],
    views: 42,
    slug: "monty-the-snake",
    createdAt: "2026-03-01T10:00:00.000Z",
};

export const mockPublicPetDataMinimal = {
    name: "Slither",
    bio: null,
    species: null,
    morph: null,
    gender: "FEMALE",
    birthDate: null,
    acquisitionDate: null,
    profilePhotoId: null,
    photos: [],
    feedings: [],
    sheddings: [],
    weightRecords: [],
    views: 0,
    slug: "slither-minimal",
    createdAt: "2026-04-01T10:00:00.000Z",
};

export const mockSlugCheck = {
    available: true,
};

export const mockSlugCheckTaken = {
    available: false,
};

// ─── User Public Profile ─────────────────────────────────────

export const mockUserPublicProfile = {
    slug: "snake-keeper",
    active: true,
    bio: "Passionate corn snake keeper from Berlin",
    tagline: "Keeping reptiles since 2015",
    location: "Berlin, Germany",
    keeperSince: "2015-06-01T00:00:00.000Z",
    hasAvatar: true,
    avatarUploadId: "upload_avatar_001",
    themePreset: "default",
    views: 128,
    showStats: true,
    showPets: true,
    showSocialLinks: true,
    showLocation: true,
    showKeeperSince: true,
    showBadges: true,
    petOrder: [],
};

export const mockPublicUserData = {
    slug: "snake-keeper",
    displayName: "SnakeKeeper",
    username: "snakekeeper",
    bio: "Passionate corn snake keeper from Berlin",
    tagline: "Keeping reptiles since 2015",
    location: "Berlin, Germany",
    keeperSince: "2015-06-01T00:00:00.000Z",
    hasAvatar: true,
    themePreset: "default",
    views: 128,
    createdAt: "2024-01-01T00:00:00.000Z",
    socialLinks: [
        { platform: "instagram", url: "https://instagram.com/snakekeeper", label: "Instagram" },
        { platform: "youtube", url: "https://youtube.com/@snakekeeper", label: "YouTube" },
    ],
    stats: {
        petCount: 3,
        totalPhotos: 45,
        totalFeedings: 120,
        totalWeightRecords: 30,
    },
    badges: [
        { key: "first_pet", nameKey: "badges.first_pet", icon: "lucide:paw-print", earnedAt: "2024-01-15T00:00:00.000Z" },
        { key: "photographer", nameKey: "badges.photographer", icon: "lucide:camera", earnedAt: "2024-06-01T00:00:00.000Z" },
    ],
    pets: [
        {
            id: "pet_001",
            name: "Monty",
            species: "Corn Snake",
            morph: "Amel",
            profilePhotoId: "photo_001",
            petSlug: "monty-the-snake",
            bio: "A friendly corn snake",
        },
        {
            id: "pet_002",
            name: "Noodle",
            species: "Corn Snake",
            morph: "Normal",
            profilePhotoId: null,
            petSlug: "noodle",
            bio: null,
        },
    ],
};

export const mockUserBadges = [
    {
        badge: {
            key: "first_pet",
            nameKey: "badges.first_pet",
            descKey: "badges.first_pet_desc",
            icon: "lucide:paw-print",
        },
    },
    {
        badge: {
            key: "first_photo",
            nameKey: "badges.first_photo",
            descKey: "badges.first_photo_desc",
            icon: "lucide:camera",
        },
    },
];

export const mockPendingComments = [
    {
        id: "comment_001",
        authorName: "Visitor",
        content: "Beautiful snake collection!",
        createdAt: "2026-04-01T10:00:00.000Z",
    },
];

export const mockApprovedComments = [
    {
        id: "comment_approved_001",
        authorName: "Snake Fan",
        content: "Amazing collection!",
        createdAt: "2026-03-20T10:00:00.000Z",
    },
    {
        id: "comment_approved_002",
        authorName: "Reptile Lover",
        content: "Great care tips!",
        createdAt: "2026-03-22T10:00:00.000Z",
    },
];

// ─── Admin Report Fixtures ──────────────────────────────────

export const mockAdminReports = {
    items: [
        {
            id: "report_001",
            targetType: "comment",
            targetId: "comment_target_001",
            targetUrl: "https://example.com/keeper/snake-keeper",
            reason: "spam",
            description: "This is a spam comment",
            reporterName: "Jane Reporter",
            status: "pending" as const,
            adminNote: null,
            resolvedAt: null,
            resolvedBy: null,
            createdAt: "2026-04-10T10:00:00.000Z",
        },
        {
            id: "report_002",
            targetType: "user_profile",
            targetId: "user_target_001",
            targetUrl: "https://example.com/keeper/bad-user",
            reason: "harassment",
            description: "Harassing content on the profile",
            reporterName: null,
            status: "pending" as const,
            adminNote: null,
            resolvedAt: null,
            resolvedBy: null,
            createdAt: "2026-04-09T08:00:00.000Z",
        },
        {
            id: "report_003",
            targetType: "pet_profile",
            targetId: "pet_target_001",
            targetUrl: null,
            reason: "misinformation",
            description: null,
            reporterName: "John Doe",
            status: "pending" as const,
            adminNote: null,
            resolvedAt: null,
            resolvedBy: null,
            createdAt: "2026-04-08T12:00:00.000Z",
        },
    ],
    meta: { page: 1, perPage: 20, total: 3, totalPages: 1 },
};

export const mockAdminReportsReviewed = {
    items: [
        {
            id: "report_004",
            targetType: "comment",
            targetId: "comment_target_002",
            targetUrl: "https://example.com/keeper/some-user",
            reason: "inappropriate",
            description: "Offensive language",
            reporterName: "Alert User",
            status: "reviewed" as const,
            adminNote: "Content removed and user warned",
            resolvedAt: "2026-04-11T14:00:00.000Z",
            resolvedBy: { id: "usr_admin_001", username: "admin" },
            createdAt: "2026-04-10T10:00:00.000Z",
        },
    ],
    meta: { page: 1, perPage: 20, total: 1, totalPages: 1 },
};

export const mockReportStats = {
    pending: 3,
    reviewed: 5,
    dismissed: 2,
};

// ─── Admin Comment Fixtures ─────────────────────────────────

export const mockAdminComments = {
    items: [
        {
            id: "admin_comment_001",
            authorName: "Visitor One",
            content: "Nice snakes!",
            approved: true,
            profileType: "user_profile",
            profileId: "profile_001",
            createdAt: "2026-04-05T10:00:00.000Z",
        },
        {
            id: "admin_comment_002",
            authorName: "Spammer",
            content: "Buy my stuff at spamsite.com",
            approved: false,
            profileType: "pet_profile",
            profileId: "profile_002",
            createdAt: "2026-04-06T11:00:00.000Z",
        },
        {
            id: "admin_comment_003",
            authorName: "Helpful Keeper",
            content: "Great care routine!",
            approved: true,
            profileType: "user_profile",
            profileId: "profile_003",
            createdAt: "2026-04-07T09:00:00.000Z",
        },
    ],
    meta: { page: 1, perPage: 20, total: 3, totalPages: 1 },
};

export const mockAdminCommentsApproved = {
    items: [
        {
            id: "admin_comment_001",
            authorName: "Visitor One",
            content: "Nice snakes!",
            approved: true,
            profileType: "user_profile",
            profileId: "profile_001",
            createdAt: "2026-04-05T10:00:00.000Z",
        },
        {
            id: "admin_comment_003",
            authorName: "Helpful Keeper",
            content: "Great care routine!",
            approved: true,
            profileType: "user_profile",
            profileId: "profile_003",
            createdAt: "2026-04-07T09:00:00.000Z",
        },
    ],
    meta: { page: 1, perPage: 20, total: 2, totalPages: 1 },
};

export const mockAdminCommentsPending = {
    items: [
        {
            id: "admin_comment_002",
            authorName: "Spammer",
            content: "Buy my stuff at spamsite.com",
            approved: false,
            profileType: "pet_profile",
            profileId: "profile_002",
            createdAt: "2026-04-06T11:00:00.000Z",
        },
    ],
    meta: { page: 1, perPage: 20, total: 1, totalPages: 1 },
};
