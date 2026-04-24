# Marketing Tracking Environment Variables

All values are validated by `apps/backend/src/config/env.ts` (Zod). The backend
will refuse to start if any of these are malformed.

| Variable                          | Type     | Default | Required when                                  |
| --------------------------------- | -------- | ------- | ---------------------------------------------- |
| `META_PIXEL_ENABLED`              | boolean  | `false` | always (set true to load Pixel in browser)     |
| `META_CAPI_ENABLED`               | boolean  | `false` | always (set true to dispatch from server)      |
| `META_CAPI_DRY_RUN`               | boolean  | `true`  | always (true = log only, no HTTP)              |
| `META_PIXEL_ID`                   | string   | empty   | `META_PIXEL_ENABLED=true` or `META_CAPI_ENABLED=true && DRY_RUN=false` |
| `META_ACCESS_TOKEN`               | string   | empty   | `META_CAPI_ENABLED=true && DRY_RUN=false`     |
| `META_TEST_EVENT_CODE`            | string   | empty   | optional (dev validation in Meta Events Manager) |
| `TRACKING_ATTRIBUTION_TTL_DAYS`   | int      | `90`    | always — must match frontend localStorage TTL  |
| `TRACKING_PENDING_RESCUE_AFTER_SECONDS` | int | `120` | always — re-enqueue stuck `pending` events older than this |
| `TRACKING_MAX_RETRY_COUNT`        | int      | `5`     | always                                          |
| `TRACKING_RETRY_BASE_DELAY_MS`    | int      | `5000`  | always                                          |
| `TRACKING_DISPATCH_TIMEOUT_MS`    | int      | `5000`  | always                                          |
| `TRACKING_EVENT_RETENTION_DAYS`   | int      | `180`   | always (purge job — not yet implemented)       |

## Frontend `runtimeConfig.public`

| Variable             | Source                                  |
| -------------------- | --------------------------------------- |
| `metaPixelEnabled`   | `process.env.META_PIXEL_ENABLED`        |
| `metaPixelId`        | `process.env.META_PIXEL_ID`             |

## Safe defaults

In production we recommend starting with:

```env
META_PIXEL_ENABLED=true
META_CAPI_ENABLED=true
META_CAPI_DRY_RUN=true   # flip to false after validating events in Test Tool
META_PIXEL_ID=...
META_ACCESS_TOKEN=...    # never commit
```
