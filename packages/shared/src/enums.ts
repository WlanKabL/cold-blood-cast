// ─── Enums (as union types for runtime compatibility) ────────

// ─── Roles & Admin Enums ─────────────────────────────────────

export type SystemRoleName = "ADMIN" | "MODERATOR" | "PRO" | "PREMIUM" | "BETA_TESTER" | "FREE";
export type SuggestionStatus = "pending" | "approved" | "rejected";
export type AnnouncementType = "info" | "warning" | "success" | "error";
export type RegistrationMode = "open" | "invite_only" | "approval";
export type EmailTemplate =
    | "welcome"
    | "account_approved"
    | "account_banned"
    | "account_rejected"
    | "pending_review"
    | "access_request"
    | "access_request_rejected"
    | "invite_code"
    | "verify_email"
    | "password_reset"
    | "custom";
export type EmailStatus = "sent" | "failed";
export type AccessRequestStatus = "pending" | "approved" | "rejected";

// ─── Legal Document Enums ─────────────────────────────────────

export type LegalDocumentKey =
    | "privacy_policy"
    | "terms_of_service"
    | "impressum"
    | "cookie_policy"
    | "acceptable_use_policy"
    | "refund_policy";

// ─── Domain Enums (mirrored from Prisma schema) ──────────────

export const ENCLOSURE_TYPES = [
    "TERRARIUM",
    "VIVARIUM",
    "AQUARIUM",
    "PALUDARIUM",
    "RACK",
    "OTHER",
] as const;
export type EnclosureType = (typeof ENCLOSURE_TYPES)[number];

export const GENDERS = ["MALE", "FEMALE", "UNKNOWN"] as const;
export type Gender = (typeof GENDERS)[number];

export const SENSOR_TYPES = ["TEMPERATURE", "HUMIDITY", "PRESSURE", "WATER"] as const;
export type SensorType = (typeof SENSOR_TYPES)[number];

export const MAINTENANCE_TYPES = [
    "CLEANING",
    "SUBSTRATE_CHANGE",
    "LAMP_REPLACEMENT",
    "WATER_CHANGE",
    "FILTER_CHANGE",
    "DISINFECTION",
    "OTHER",
] as const;
export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const VET_VISIT_TYPES = [
    "CHECKUP",
    "EMERGENCY",
    "SURGERY",
    "VACCINATION",
    "DEWORMING",
    "FECAL_TEST",
    "CONSULTATION",
    "FOLLOW_UP",
    "OTHER",
] as const;
export type VetVisitType = (typeof VET_VISIT_TYPES)[number];

export const ALERT_CONDITIONS = ["ABOVE", "BELOW", "OUTSIDE_RANGE"] as const;
export type AlertCondition = (typeof ALERT_CONDITIONS)[number];
