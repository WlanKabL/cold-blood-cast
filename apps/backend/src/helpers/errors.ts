// ─── Application Error Codes ─────────────────────────────────
// Convention: E_ prefix, SCREAMING_SNAKE_CASE, domain-grouped

export const ErrorCodes = {
    // ── General ──────────────────────────────────
    E_INTERNAL_SERVER_ERROR: "E_INTERNAL_SERVER_ERROR",
    E_VALIDATION_ERROR: "E_VALIDATION_ERROR",
    E_NOT_FOUND: "E_NOT_FOUND",
    E_FORBIDDEN: "E_FORBIDDEN",

    // ── Auth ─────────────────────────────────────
    E_AUTH_INVALID_CREDENTIALS: "E_AUTH_INVALID_CREDENTIALS",
    E_AUTH_TOKEN_EXPIRED: "E_AUTH_TOKEN_EXPIRED",
    E_AUTH_TOKEN_INVALID: "E_AUTH_TOKEN_INVALID",
    E_AUTH_TOKEN_MISSING: "E_AUTH_TOKEN_MISSING",
    E_AUTH_REFRESH_TOKEN_INVALID: "E_AUTH_REFRESH_TOKEN_INVALID",
    E_AUTH_REFRESH_TOKEN_EXPIRED: "E_AUTH_REFRESH_TOKEN_EXPIRED",
    E_AUTH_USER_EXISTS: "E_AUTH_USER_EXISTS",
    E_AUTH_USERNAME_TAKEN: "E_AUTH_USERNAME_TAKEN",
    E_AUTH_EMAIL_TAKEN: "E_AUTH_EMAIL_TAKEN",

    // ── User ─────────────────────────────────────
    E_USER_NOT_FOUND: "E_USER_NOT_FOUND",
    E_USER_UPDATE_FAILED: "E_USER_UPDATE_FAILED",

    // ── Enclosures ─────────────────────────────
    E_ENCLOSURE_NOT_FOUND: "E_ENCLOSURE_NOT_FOUND",

    // ── Pets ─────────────────────────────────────
    E_PET_NOT_FOUND: "E_PET_NOT_FOUND",
    E_PET_PHOTO_NOT_FOUND: "E_PET_PHOTO_NOT_FOUND",

    // ── Sensors ──────────────────────────────────
    E_SENSOR_NOT_FOUND: "E_SENSOR_NOT_FOUND",

    // ── Feed Items ──────────────────────────────
    E_FEED_ITEM_NOT_FOUND: "E_FEED_ITEM_NOT_FOUND",

    // ── Feedings ─────────────────────────────────
    E_FEEDING_NOT_FOUND: "E_FEEDING_NOT_FOUND",

    // ── Sheddings ────────────────────────────────
    E_SHEDDING_NOT_FOUND: "E_SHEDDING_NOT_FOUND",

    // ── Weight Records ───────────────────────────
    E_WEIGHT_RECORD_NOT_FOUND: "E_WEIGHT_RECORD_NOT_FOUND",

    // ── Alert Rules ──────────────────────────────
    E_ALERT_RULE_NOT_FOUND: "E_ALERT_RULE_NOT_FOUND",

    // ── API Keys ─────────────────────────────────
    E_API_KEY_NOT_FOUND: "E_API_KEY_NOT_FOUND",
    E_API_KEY_REVOKED: "E_API_KEY_REVOKED",
    E_API_KEY_EXPIRED: "E_API_KEY_EXPIRED",

    // ── Upload ───────────────────────────────────
    E_UPLOAD_TOO_LARGE: "E_UPLOAD_TOO_LARGE",
    E_UPLOAD_INVALID_TYPE: "E_UPLOAD_INVALID_TYPE",
    E_UPLOAD_FAILED: "E_UPLOAD_FAILED",
    E_UPLOAD_LIMIT_REACHED: "E_UPLOAD_LIMIT_REACHED",

    // ── Admin / Roles ────────────────────────────────
    E_ADMIN_REQUIRED: "E_ADMIN_REQUIRED",
    E_ROLE_NOT_FOUND: "E_ROLE_NOT_FOUND",
    E_ROLE_IS_SYSTEM: "E_ROLE_IS_SYSTEM",
    E_ROLE_ALREADY_ASSIGNED: "E_ROLE_ALREADY_ASSIGNED",
    E_USER_BANNED: "E_USER_BANNED",

    // ── Feature Flags ────────────────────────────────
    E_FEATURE_FLAG_NOT_FOUND: "E_FEATURE_FLAG_NOT_FOUND",
    E_FEATURE_DISABLED: "E_FEATURE_DISABLED",

    // ── Announcements ────────────────────────────────
    E_ANNOUNCEMENT_NOT_FOUND: "E_ANNOUNCEMENT_NOT_FOUND",

    // ── Maintenance ──────────────────────────────────
    E_MAINTENANCE_MODE: "E_MAINTENANCE_MODE",

    // ── Subscription ─────────────────────────────────
    E_SUBSCRIPTION_NOT_FOUND: "E_SUBSCRIPTION_NOT_FOUND",
    E_SUBSCRIPTION_ALREADY_EXISTS: "E_SUBSCRIPTION_ALREADY_EXISTS",

    // ── Email Verification ───────────────────────────
    E_EMAIL_NOT_VERIFIED: "E_EMAIL_NOT_VERIFIED",
    E_VERIFICATION_CODE_INVALID: "E_VERIFICATION_CODE_INVALID",
    E_VERIFICATION_CODE_EXPIRED: "E_VERIFICATION_CODE_EXPIRED",

    // ── Password Reset ───────────────────────────────
    E_RESET_TOKEN_INVALID: "E_RESET_TOKEN_INVALID",
    E_RESET_TOKEN_EXPIRED: "E_RESET_TOKEN_EXPIRED",
    // ── Account Deletion ─────────────────────────
    E_DELETE_TOKEN_INVALID: "E_DELETE_TOKEN_INVALID",
    E_DELETE_TOKEN_EXPIRED: "E_DELETE_TOKEN_EXPIRED",
    // ── Data Export (GDPR) ─────────────────────────────
    E_EXPORT_NOT_FOUND: "E_EXPORT_NOT_FOUND",
    E_EXPORT_FAILED: "E_EXPORT_FAILED",
    E_EXPORT_COOLDOWN: "E_EXPORT_COOLDOWN",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ─── Application Error Class ─────────────────────────────────

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly details?: unknown;

    constructor(code: ErrorCode, statusCode: number, message: string, details?: unknown) {
        super(message);
        this.name = "AppError";
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }

    toResponse() {
        return {
            success: false as const,
            error: {
                code: this.code,
                message: this.message,
                ...(this.details ? { details: this.details } : {}),
            },
        };
    }
}

// ─── Factory Helpers ─────────────────────────────────────────

export function badRequest(code: ErrorCode, message: string, details?: unknown): AppError {
    return new AppError(code, 400, message, details);
}

export function unauthorized(code: ErrorCode, message: string): AppError {
    return new AppError(code, 401, message);
}

export function forbidden(codeOrMessage?: ErrorCode | string, message?: string): AppError {
    // Overload: forbidden() | forbidden("msg") | forbidden(ErrorCode, "msg")
    if (message !== undefined) {
        return new AppError((codeOrMessage as ErrorCode) ?? ErrorCodes.E_FORBIDDEN, 403, message);
    }
    return new AppError(ErrorCodes.E_FORBIDDEN, 403, codeOrMessage ?? "Forbidden");
}

export function notFound(code: ErrorCode, message: string): AppError {
    return new AppError(code, 404, message);
}

export function internalError(message = "Internal server error"): AppError {
    return new AppError(ErrorCodes.E_INTERNAL_SERVER_ERROR, 500, message);
}

export function serviceUnavailable(code: ErrorCode, message: string): AppError {
    return new AppError(code, 503, message);
}
