# Marketing Event Taxonomy

> Source of truth for which marketing events Cold Blood Cast tracks, what they
> mean, and how they are dispatched. Aligned with marketing-tracking-plan.md
> v1.7.

## Events (v1)

| Event Name             | Trigger                                    | Server Dispatch | Browser Dispatch |
| ---------------------- | ------------------------------------------ | --------------- | ---------------- |
| `CompleteRegistration` | Successful signup (after user creation)    | ✅ Meta CAPI    | ✅ Meta Pixel    |
| `PageView`             | (reserved, not yet emitted)                | —               | —                |

## Activation events (internal, not sent to Meta in v1)

These power the activation-rate KPI in the admin dashboard.

| Type                   | Trigger                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `AnimalProfileCreated` | First pet created for a user                                |
| `FirstCareEntryCreated`| First feeding / weight / shedding / care entry              |

Activation window: **7 days** after signup (`ACTIVATION_WINDOW_DAYS_V1`).

## Canonical `event_id`

Generated server-side by `buildCanonicalEventId()`:

```
event_id = uuidv5(
  `${user.id}:${user.id}:${eventName}`,
  namespace = "6f2c2d0e-9b6f-5a1c-9b3e-7e3a8b2c1d4a",
)
```

Same `event_id` is used by **both** the server (CAPI) and browser (Pixel)
dispatch so Meta de-duplicates them. The browser is told the canonical id by
the registration response (`marketingDispatch.eventId`).

## Event sources

`marketing_events.event_source ∈ { "browser", "server", "internal" }`

Each registration produces **two** rows (one per source) for full auditability,
even when consent denies dispatch.

## Statuses

`marketing_events.status ∈ { "pending", "processing", "sent", "failed", "skipped" }`

- `pending`: created, awaiting dispatch
- `processing`: BullMQ worker has picked it up
- `sent`: provider acknowledged delivery
- `failed`: hard failure after exhausting retries
- `skipped`: consent or config disabled dispatch (audit row only)
