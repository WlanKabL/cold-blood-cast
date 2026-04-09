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
