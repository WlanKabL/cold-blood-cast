import type { AnnouncementType } from "./enums.js";

// ─── Auth ────────────────────────────────────────────────────

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl?: string | null;
    createdAt?: string;
    banned?: boolean;
    emailVerified?: boolean;
    onboardingCompleted?: boolean;
    locale?: string;
    weeklyReportEnabled?: boolean;
}

export interface FeatureTierInfo {
    role: string;
    displayName: string;
    color: string;
    priority: number;
}

export interface AuthMeResponse {
    user: AuthUser;
    roles: string[];
    features: Record<string, boolean>;
    limits: Record<string, number>;
    enabledFlags: string[];
    featureTiers: Record<string, FeatureTierInfo[]>;
    impersonatedBy?: string | null;
}

export interface AuthTokens {
    accessToken: string;
}

export interface LoginPayload {
    login: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    inviteCode?: string;
}

// ─── Roles ───────────────────────────────────────────────────

export interface Role {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    color: string | null;
    isSystem: boolean;
    priority: number;
    showBadge: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RoleDetail extends Role {
    featureFlags: Array<{
        featureFlagId: string;
        enabled: boolean;
        featureFlag: FeatureFlag;
    }>;
    limits: Array<{ key: string; value: number }>;
    users: Array<{
        user: {
            id: string;
            username: string;
            email: string;
            displayName: string | null;
        };
    }>;
    _count: { users: number };
}

// ─── Feature Flags ───────────────────────────────────────────

export interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    description: string | null;
    category: string;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

// ─── Tags ────────────────────────────────────────────────────

export interface Tag {
    id: string;
    name: string;
    userId: string | null;
    category: string;
    color: string | null;
    createdAt: string;
}

// ─── Announcements ──────────────────────────────────────────

export interface Announcement {
    id: string;
    title: string;
    content: string;
    type: AnnouncementType;
    global: boolean;
    targetUserId: string | null;
    active: boolean;
    startsAt: string | null;
    expiresAt: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    isRead?: boolean;
}

// ─── API Keys ───────────────────────────────────────────────

export interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    scopes: string[];
    lastUsedAt: string | null;
    expiresAt: string | null;
    revoked: boolean;
    createdAt: string;
}

export interface ApiKeyWithSecret extends ApiKey {
    key: string;
}

export interface CreateApiKeyPayload {
    name: string;
    scopes?: string[];
    expiresInDays?: number;
}

// ─── Admin Types ─────────────────────────────────────────────

export interface AdminUser {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    banned: boolean;
    approved: boolean;
    emailVerified: boolean;
    bannedReason: string | null;
    lastActiveAt: string | null;
    createdAt: string;
    updatedAt: string;
    roles: Array<{
        role: {
            id: string;
            name: string;
            displayName: string;
            color: string | null;
        };
    }>;
    _count: {
        enclosures: number;
        pets: number;
        sensors: number;
    };
}

export interface AdminUserDetail extends AdminUser {
    bannedAt: string | null;
    bannedBy: string | null;
    featureFlags: Array<{
        featureFlagId: string;
        enabled: boolean;
        featureFlag: FeatureFlag;
    }>;
    limitOverrides: Array<{ key: string; value: number }>;
    _count: {
        enclosures: number;
        pets: number;
        sensors: number;
        alertRules: number;
        feedings: number;
        sheddings: number;
    };
}

export interface PlatformStats {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    premiumUsers: number;
    totalEnclosures: number;
    totalSensors: number;
    totalPets: number;
    todayNewUsers: number;
    todayNewSensors: number;
    pendingAccessRequests: number;
    totalAuditLogs: number;
}

export interface UserGrowthPoint {
    date: string;
    count: number;
}

export interface AuditLogEntry {
    id: string;
    userId: string | null;
    action: string;
    entity: string | null;
    entityId: string | null;
    details: unknown;
    ipAddress: string | null;
    createdAt: string;
}

export interface SystemSettingEntry {
    id: string;
    key: string;
    value: string;
    updatedAt: string;
}

// ─── Invite Codes ─────────────────────────────────────────────

export interface InviteCodeUse {
    userId: string;
    usedAt: string;
}

export interface InviteCode {
    id: string;
    code: string;
    createdBy: string;
    label: string | null;
    maxUses: number;
    uses: number;
    expiresAt: string | null;
    active: boolean;
    createdAt: string;
    usages: InviteCodeUse[];
}

export interface CreateInviteCodePayload {
    label?: string;
    maxUses?: number;
    expiresAt?: string | null;
    email?: string;
}

// ─── Email Log ───────────────────────────────────────────────

export interface EmailLogEntry {
    id: string;
    to: string;
    userId: string | null;
    template: string;
    subject: string;
    status: string;
    sentBy: string | null;
    error: string | null;
    sentAt: string;
    user?: { id: string; username: string; email: string } | null;
}

export interface SendEmailPayload {
    to?: string;
    userId?: string;
    template: string;
    subject?: string;
    templateData?: Record<string, string>;
}

// ─── Access Requests ─────────────────────────────────────────

export interface AccessRequest {
    id: string;
    email: string;
    reason: string | null;
    status: string;
    reviewedBy: string | null;
    reviewedAt: string | null;
    createdAt: string;
    reviewer?: { id: string; username: string } | null;
}

// ─── Legal Documents ─────────────────────────────────────────

/** Impressum structured metadata */
export interface ImpressumMetadata {
    companyName: string;
    legalForm: string;
    ownerName: string;
    street: string;
    zip: string;
    city: string;
    country: string;
    email: string;
    phone?: string;
    registerCourt?: string;
    registerNumber?: string;
    vatId?: string;
    responsiblePerson?: string;
    websiteUrl?: string;
}

/** Legal document (public-facing) */
export interface LegalDocument {
    id: string;
    key: string;
    title: string;
    titleDe: string;
    content: string;
    contentDe: string;
    metadata: ImpressumMetadata | null;
    isPublished: boolean;
    sortOrder: number;
    updatedAt: string;
}

/** Legal document for admin (includes updatedBy) */
export interface AdminLegalDocument extends LegalDocument {
    updatedBy: string | null;
    updaterName?: string;
}

/** Payload for updating a legal document */
export interface UpdateLegalDocumentPayload {
    title?: string;
    titleDe?: string;
    content?: string;
    contentDe?: string;
    metadata?: ImpressumMetadata | null;
    sortOrder?: number;
}

/** Public legal document (content for display) */
export interface PublicLegalDocument {
    key: string;
    title: string;
    content: string;
    updatedAt: string;
}

/** Legal document link for footer/nav */
export interface LegalDocumentLink {
    key: string;
    title: string;
    titleDe: string;
}

// ─── GDPR Data Export ────────────────────────────────────────

export type DataExportStatus = "pending" | "processing" | "ready" | "failed" | "expired";

export interface DataExportInfo {
    id: string;
    status: DataExportStatus;
    createdAt: string;
    expiresAt: string | null;
}

// ─── User Public Profile ─────────────────────────────────────

export type ThemePreset =
    | "default"
    | "ocean"
    | "forest"
    | "sunset"
    | "midnight"
    | "desert"
    | "arctic";

export type SocialPlatform =
    | "instagram"
    | "youtube"
    | "tiktok"
    | "twitter"
    | "facebook"
    | "website"
    | "discord"
    | "custom";

export interface UserPublicProfileData {
    id: string;
    slug: string;
    active: boolean;
    bio: string | null;
    tagline: string | null;
    location: string | null;
    keeperSince: string | null;
    hasAvatar: boolean;
    showStats: boolean;
    showPets: boolean;
    showSocialLinks: boolean;
    showLocation: boolean;
    showKeeperSince: boolean;
    showBadges: boolean;
    themePreset: ThemePreset;
    views: number;
    createdAt: string;
    socialLinks: UserSocialLinkData[];
    petOrder: UserPetOrderData[];
}

export interface UserSocialLinkData {
    id: string;
    platform: SocialPlatform;
    url: string;
    label: string | null;
    sortOrder: number;
}

export interface UserPetOrderData {
    petId: string;
    petName: string;
    hasPublicProfile: boolean;
    sortOrder: number;
}

/** Public-facing user profile (for /keeper/:slug) */
export interface PublicUserData {
    slug: string;
    displayName: string | null;
    username: string;
    bio: string | null;
    tagline: string | null;
    location: string | null;
    keeperSince: string | null;
    hasAvatar: boolean;
    themePreset: ThemePreset;
    views: number;
    createdAt: string;

    socialLinks: Array<{
        platform: string;
        url: string;
        label: string | null;
    }>;

    stats: {
        petCount: number;
        totalPhotos: number;
        totalFeedings: number;
        totalWeightRecords: number;
    } | null;

    badges: Array<{
        key: string;
        nameKey: string;
        icon: string;
        earnedAt: string;
    }>;

    pets: Array<{
        id: string;
        name: string;
        species: string | null;
        morph: string | null;
        profilePhotoUrl: string | null;
        petSlug: string | null;
        bio: string | null;
    }>;
}

/** Public-facing pet profile via /keeper/:userSlug/p/:petSlug */
export interface PublicPetData {
    name: string;
    bio: string | null;
    species: string | null;
    morph: string | null;
    gender: string | null;
    birthDate: string | null;
    acquisitionDate: string | null;
    profilePhotoId: string | null;
    photos: Array<{
        id: string;
        caption: string | null;
        tags: string[];
        isProfilePicture: boolean;
        takenAt: string;
    }>;
    feedings: Array<{
        feedItem: string | null;
        foodType: string;
        foodSize: string | null;
        quantity: number;
        accepted: boolean;
        fedAt: string;
        notes: string | null;
    }>;
    sheddings: Array<{
        startedAt: string;
        completedAt: string | null;
        complete: boolean;
        quality: string | null;
        notes: string | null;
    }>;
    weightRecords: Array<{
        weightGrams: number;
        measuredAt: string;
    }>;
    views: number;
    slug: string;
    userSlug: string;
    createdAt: string;
    likes: number;
    comments: PublicCommentData[];
}

export interface PublicCommentData {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
}

// ─── Badges ──────────────────────────────────────────────────

export interface BadgeDefinition {
    key: string;
    nameKey: string;
    descKey: string;
    icon: string;
    category: string;
    threshold: number | null;
}

export interface UserBadgeData {
    key: string;
    nameKey: string;
    descKey: string;
    icon: string;
    category: string;
    earnedAt: string;
}

// ─── Community ───────────────────────────────────────────────

export interface ProfileLikeStatus {
    count: number;
    liked: boolean;
}

export interface ProfileCommentForModeration {
    id: string;
    profileType: string;
    profileId: string;
    authorName: string;
    content: string;
    approved: boolean;
    createdAt: string;
}
