// Re-export all shared types from @cold-blood-cast/shared
// This file serves as a barrel export for the frontend.
export type {
    ApiSuccessResponse,
    ApiErrorDetail,
    ApiErrorResponse,
    ApiResponse,
    PaginationMeta,
    PaginatedResponse,
    SystemRoleName,
    SuggestionStatus,
    AnnouncementType,
    RegistrationMode,
    AuthUser,
    AuthTokens,
    LoginPayload,
    RegisterPayload,
    AuthMeResponse,
    FeatureTierInfo,
    Role,
    RoleDetail,
    FeatureFlag,
    Tag,
    Announcement,
    ApiKey,
    ApiKeyWithSecret,
    CreateApiKeyPayload,
    AdminUser,
    AdminUserDetail,
    PlatformStats,
    UserGrowthPoint,
    AuditLogEntry,
    SystemSettingEntry,
    InviteCode,
    InviteCodeUse,
    CreateInviteCodePayload,
    AccessRequest,
    LegalDocumentKey,
    ImpressumMetadata,
    LegalDocument,
    AdminLegalDocument,
    UpdateLegalDocumentPayload,
    PublicLegalDocument,
    LegalDocumentLink,
    DataExportStatus,
    DataExportInfo,
} from "@cold-blood-cast/shared";

// ── Local admin types (not in shared) ────────────

export interface AdminReport {
    id: string;
    targetType: string;
    targetId: string;
    targetUrl: string | null;
    reason: string;
    description: string | null;
    reporterName: string | null;
    status: "pending" | "reviewed" | "dismissed";
    adminNote: string | null;
    resolvedAt: string | null;
    resolvedBy: { id: string; username: string } | null;
    targetUser: { id: string; username: string; banned: boolean } | null;
    createdAt: string;
}

export interface AdminComment {
    id: string;
    authorName: string;
    content: string;
    approved: boolean;
    profileType: string;
    profileId: string;
    createdAt: string;
}
