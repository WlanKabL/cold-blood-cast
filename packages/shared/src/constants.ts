// ─── Hardcoded Admin Constants ───────────────────────────────
// These values are seeded in the database and should not be
// created or deleted through the UI — only toggled / adjusted.

/** All valid limit keys used by roles and user overrides */
export const LIMIT_KEYS = [
    "max_enclosures",
    "max_pets",
    "max_sensors_per_enclosure",
    "max_alert_rules",
] as const;

export type LimitKey = (typeof LIMIT_KEYS)[number];

/** Valid registration modes for the platform */
export const REGISTRATION_MODES = ["open", "invite_only", "approval"] as const;

export type RegistrationModeValue = (typeof REGISTRATION_MODES)[number];

/** Setting keys that belong to the Notifications page — hidden from general System Settings */
export const NOTIFICATION_SETTING_KEYS = [
    "telegram_enabled",
    "discord_enabled",
    "notify_on_register",
    "notify_on_login",
    "notify_on_first_login",
    "notify_on_pending",
    "notify_on_server_error",
    "notify_on_sensor_alert",
    "notify_on_new_comment",
    "notify_on_new_report",
] as const;

export type NotificationSettingKey = (typeof NOTIFICATION_SETTING_KEYS)[number];

/** Setting keys for weekly report configuration — shown on Admin Weekly Report page */
export const WEEKLY_REPORT_SETTING_KEYS = ["weekly_report_enabled"] as const;

export type WeeklyReportSettingKey = (typeof WEEKLY_REPORT_SETTING_KEYS)[number];

/** Known system setting keys */
export const SYSTEM_SETTING_KEYS = [
    "registration_mode",
    "maintenance_mode",
    "default_role",
    ...NOTIFICATION_SETTING_KEYS,
    ...WEEKLY_REPORT_SETTING_KEYS,
] as const;

export type SystemSettingKey = (typeof SYSTEM_SETTING_KEYS)[number];

/** All legal document keys */
export const LEGAL_DOCUMENT_KEYS = [
    "privacy_policy",
    "terms_of_service",
    "impressum",
    "cookie_policy",
    "acceptable_use_policy",
    "refund_policy",
] as const;

export type LegalDocumentKeyConst = (typeof LEGAL_DOCUMENT_KEYS)[number];
