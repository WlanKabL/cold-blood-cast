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
    EnclosureType,
    Gender,
    SensorType,
    MaintenanceType,
    VetVisitType,
    AlertCondition,
} from "./enums.js";

export {
    ENCLOSURE_TYPES,
    GENDERS,
    SENSOR_TYPES,
    MAINTENANCE_TYPES,
    VET_VISIT_TYPES,
    ALERT_CONDITIONS,
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
    ThemePreset,
    SocialPlatform,
    UserPublicProfileData,
    UserSocialLinkData,
    UserPetOrderData,
    PublicUserData,
    PublicPetData,
    PublicCommentData,
    BadgeDefinition,
    UserBadgeData,
    ProfileLikeStatus,
    ProfileCommentForModeration,
} from "./models.js";
