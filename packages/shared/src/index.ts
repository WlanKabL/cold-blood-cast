// ─── @cold-blood-cast/shared ─────────────────────────────────────────
// Shared types, enums, and utilities across all Cold Blood Cast apps.

export {
    LIMIT_KEYS,
    REGISTRATION_MODES,
    SYSTEM_SETTING_KEYS,
    NOTIFICATION_SETTING_KEYS,
    WEEKLY_REPORT_SETTING_KEYS,
    LEGAL_DOCUMENT_KEYS,
} from "./constants.js";

export type {
    LimitKey,
    RegistrationModeValue,
    SystemSettingKey,
    NotificationSettingKey,
    WeeklyReportSettingKey,
    LegalDocumentKeyConst,
} from "./constants.js";

export type {
    ApiSuccessResponse,
    ApiErrorDetail,
    ApiErrorResponse,
    ApiResponse,
    PaginationMeta,
    PaginatedResponse,
} from "./api.js";

export type {
    SystemRoleName,
    SuggestionStatus,
    AnnouncementType,
    RegistrationMode,
    EmailTemplate,
    EmailStatus,
    AccessRequestStatus,
    LegalDocumentKey,
} from "./enums.js";

export type {
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
    EmailLogEntry,
    SendEmailPayload,
    AccessRequest,
    ImpressumMetadata,
    LegalDocument,
    AdminLegalDocument,
    UpdateLegalDocumentPayload,
    PublicLegalDocument,
    LegalDocumentLink,
    DataExportStatus,
    DataExportInfo,
} from "./models.js";
