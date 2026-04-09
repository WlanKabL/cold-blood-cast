# Cold Blood Cast — Cold Blood Cast Infrastructure Port Workbuffer

> Comprehensive gap analysis: what Cold Blood Cast has that CBC is missing.
> Trading-specific modules are excluded.
> **STATUS: ✅ COMPLETE — All items implemented, 111 tests passing.**

---

## Status Legend

- ✅ = Done

---

## 1. Backend — Helpers & Config

| Item | Status |
|------|--------|
| `config.ts` — 14 new env vars (SMTP, encryption, uploads, notifications) | ✅ |
| `helpers/user-agent.ts` — UA normalization for login device tracking | ✅ |
| `helpers/encryption.ts` — AES-256-GCM encrypt/decrypt + HMAC hash | ✅ |
| `helpers/file-crypto.ts` — File encryption at rest | ✅ |

## 2. Backend — Services & Routes

| Item | Status |
|------|--------|
| Auth: forgot-password, reset-password, verify-email, resend-verification | ✅ |
| Auth: request/confirm account deletion with email tokens | ✅ |
| Auth: login device tracking + new-device notifications | ✅ |
| Mail service (nodemailer) + 12 email templates | ✅ |
| Notification service (Telegram + Discord) | ✅ |
| Access requests service + routes | ✅ |
| API keys service + routes | ✅ |
| Uploads service + routes (multer + optional encryption) | ✅ |
| Maintenance service (cleanup, retention, orphan removal) | ✅ |
| Admin routes (access-requests, emails, maintenance) | ✅ |

## 3. Prisma Models

| Item | Status |
|------|--------|
| User fields (verification, reset, deletion tokens) | ✅ |
| ApiKey, EmailLog, Upload, MaintenanceLog models | ✅ |
| Migration applied | ✅ |

## 4. Frontend — Infrastructure

| Item | Status |
|------|--------|
| `app.vue` — root component with settings init | ✅ |
| `error.vue` — global error page | ✅ |
| `middleware/feature-gate.ts` — route-level feature gating | ✅ |
| `composables/useFormatters.ts` — date/number formatting | ✅ |
| `composables/useQueryParams.ts` — URL query sync | ✅ |
| `composables/useFeatureAccess.ts` — feature flag check | ✅ |
| `composables/useKeyboardShortcuts.ts` — global + local shortcuts | ✅ |

## 5. Frontend — Pages & UI

| Item | Status |
|------|--------|
| `forgot-password.vue` | ✅ |
| `reset-password.vue` | ✅ |
| `verify-email.vue` | ✅ |
| `confirm-delete.vue` | ✅ |
| `unsubscribe.vue` | ✅ |
| `api-keys.vue` | ✅ |
| `export/[token].vue` | ✅ |
| `admin/access-requests.vue` | ✅ |
| `admin/emails.vue` | ✅ |
| Login page — forgot password link | ✅ |
| Settings page — email verification section | ✅ |
| Admin sidebar — access requests + email log nav | ✅ |
| i18n DE + EN — all new keys | ✅ |

## 6. Seed & Tests

| Item | Status |
|------|--------|
| Seed v3 — new feature flags + system settings | ✅ |
| Dependencies — nodemailer + multer installed | ✅ |
| Tests — user-agent, encryption, apiKeys, formatters (34 new, 111 total) | ✅ |
| `export/[token].vue` | ❌ | Data export download page (token-based) |
| All existing pages | ✅ | dashboard, settings, login, register, admin/*, legal/*, sensors, enclosures, pets |

## 6. i18n Keys Needed

All new pages need DE + EN translations:
- errorPage: title, fallback, goHome
- forgotPassword: title, description, emailLabel, submit, success, backToLogin
- resetPassword: title, description, newPassword, confirmPassword, submit, success, invalidToken
- verifyEmail: title, description, codeLabel, submit, resend, success
- confirmDelete: title, description, confirm, cancelled
- unsubscribe: title, description, confirm, success
- apiKeys: title, description, create, name, scopes, expiresAt, revoke, delete, copyWarning
- adminAccessRequests: title, pending, approve, reject, email, reason, status
- adminEmails: title, logs, send, template, to, subject
- common: justNow, minutesAgo, hoursAgo, daysAgo
- keyboard shortcuts labels

---

## Implementation Order

### Phase 1: Backend Infrastructure (foundations first)
1. ✅ `config.ts` — add new env vars (ENCRYPTION_KEY, SMTP_*, UPLOAD_DIR, FRONTEND_URL, TELEGRAM_*, DISCORD_*)
2. ❌ `helpers/user-agent.ts`
3. ❌ `helpers/encryption.ts`
4. ❌ `helpers/file-crypto.ts`
5. ❌ Prisma migration: add User fields + ApiKey + EmailLog + Upload + MaintenanceLog models
6. ❌ `services/mail.service.ts` + templates
7. ❌ `services/notification.service.ts`

### Phase 2: Backend Features
8. ❌ Auth: forgot-password + reset-password + verify-email + resend-verification + login device tracking
9. ❌ `services/accessRequests.service.ts` + routes
10. ❌ `services/apiKeys.service.ts` + routes
11. ❌ `services/uploads.service.ts` + routes
12. ❌ `services/maintenance.service.ts`

### Phase 3: Frontend Infrastructure
13. ❌ `app.vue`
14. ❌ `error.vue`
15. ❌ `composables/useFormatters.ts`
16. ❌ `composables/useQueryParams.ts`
17. ❌ `composables/useFeatureAccess.ts`
18. ❌ `middleware/feature-gate.ts`
19. ❌ `composables/useKeyboardShortcuts.ts`

### Phase 4: Frontend Pages
20. ❌ `pages/forgot-password.vue`
21. ❌ `pages/reset-password.vue`
22. ❌ `pages/verify-email.vue`
23. ❌ `pages/confirm-delete.vue`
24. ❌ `pages/unsubscribe.vue`
25. ❌ `pages/api-keys.vue`
26. ❌ `pages/export/[token].vue`
27. ❌ `pages/admin/access-requests.vue`
28. ❌ `pages/admin/emails.vue`

### Phase 5: Finalization
29. ❌ i18n keys (DE + EN)
30. ❌ Seed v3
31. ❌ Tests for all new modules
32. ❌ Login page: add forgot-password link
33. ❌ Settings page: add email verification section
34. ❌ Admin sidebar: add access-requests + emails links
