# Marketing Tracking — Privacy Impact

> Companion to marketing-tracking-plan.md v1.7. Use this when answering DSGVO /
> Art. 6 / Art. 7 questions internally or to users.

## Lawful basis

- **Art. 6 (1) (a) DSGVO** — explicit consent via cookie banner
  (`cookie_consent.marketing = true`).
- Consent is **opt-in**: default state is denied. Banner offers a separate
  Marketing toggle next to Analytics. Refusing only Marketing leaves Analytics
  intact.

## Consent matrix

| Cookie consent state | Persist event row | Store full PII payload | Browser dispatch (Pixel) | Server dispatch (CAPI) |
| -------------------- | ----------------- | ---------------------- | ------------------------ | ---------------------- |
| `granted`            | ✅                | ✅                     | ✅                       | ✅                     |
| `denied`             | ✅ (audit only)   | ❌                     | ❌                       | ❌                     |
| `unknown`            | ✅ (audit only)   | ❌                     | ❌                       | ❌                     |
| `revoked`            | ✅ (audit only)   | ❌                     | ❌                       | ❌                     |

When dispatch is not allowed the event row is created with
`status = "skipped"` so we keep the audit trail without leaking data.

## Data sent to Meta (only when `granted`)

| Field               | Source                | Hashing                      |
| ------------------- | --------------------- | ---------------------------- |
| `em`                | user email            | SHA-256 (lowercase, trimmed) |
| `external_id`       | internal user id      | SHA-256                      |
| `client_ip`         | request IP            | sent as-is to Meta           |
| `client_user_agent` | request User-Agent    | sent as-is                   |
| `fbc`/`fbp`         | Meta cookies (if any) | sent as-is                   |

We never send raw email, name, address, plaintext IDs.

## Data minimization

- For `denied`/`unknown`/`revoked`: we do **not** persist `client_ip`,
  `user_agent`, `fbc`, `fbp` or any payload. Only `event_name`,
  `consent_state`, `status` and timestamps are kept.
- Landing attribution (UTM/referrer) **is** captured even without marketing
  consent because it is anonymous (no user binding) until signup. On signup the
  binding only happens if the user actively registers — at which point the
  attribution becomes "first-party operational data" needed for product
  analytics (Art. 6 (1) (f)).

## Retention

- `marketing_events`: retained for `TRACKING_EVENT_RETENTION_DAYS`
  (default 180 days). Daily purge job will be added in a follow-up.
- `landing_attributions`: kept for the lifetime of the bound user account or
  90 days for unbound landings.
- `user_attributions`: kept for the lifetime of the user account.

## Subject rights

- **Right to access**: covered by the existing GDPR export (will include
  marketing rows in a follow-up enhancement).
- **Right to erasure**: cascade-delete on the User row removes
  `user_attributions` and `user_activation_events` automatically. Server-source
  `marketing_events` are detached (`user_id → SET NULL`) so the audit trail
  survives without identifying the subject.
- **Right to withdraw consent**: revoking the marketing cookie immediately
  stops new dispatches. Already-sent events cannot be recalled from Meta — this
  is disclosed in the privacy policy.
