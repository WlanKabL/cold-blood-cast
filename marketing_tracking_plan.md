# PLAN.md

# KeeperLog Marketing Tracking & Attribution System

# v1.7 Execution Plan for Claude

# Target: KeeperLog first, reusable later for ZentraX

---

## 0. Purpose of this document

This document defines the implementation and architecture plan for a first-party marketing tracking and attribution system for KeeperLog.

The purpose is **not** to add tracking because it sounds advanced.
The purpose is to build a clean, maintainable, privacy-aware marketing data backbone that can answer:

- Which campaign, ad set, ad, or creative brought a user?
- Which users only signed up?
- Which users actually activated and used the product?
- Which campaigns generate higher-quality users?
- Which events should be sent to Meta Pixel and Conversions API?
- How can the same system later be reused for ZentraX?

This plan is written so Claude can:

- audit the real codebase first
- refine implementation details based on repository reality
- implement the system in phases
- avoid overengineering
- keep code clean and maintainable
- remove ambiguity
- document tradeoffs and constraints

This revision explicitly removes ambiguity around:

- deduplication
- consent gating
- attribution rules
- queue/retry robustness
- KPI definitions
- activation event eligibility

---

## 1. Core goals

### 1.1 Primary business goal

Build a first-party attribution and marketing event system that allows KeeperLog to:

- measure ad performance beyond clicks
- tie registrations and activation events to acquisition source
- improve Meta optimization over time
- support future campaign scaling with better signal quality

### 1.2 Technical goals

Build a reusable tracking layer that:

- captures attribution data on landing
- persists attribution through signup
- emits browser and server events in a deduplicated way
- stores attribution on user level
- exposes attribution and campaign quality in an internal dashboard
- is extensible for future products like ZentraX

### 1.3 Non-goals for v1

Do **not** build in v1:

- full BI platform
- full multi-touch attribution
- automatic audience sync
- ad spend import
- offline conversion re-upload jobs
- predictive LTV
- warehouse / ELT stack
- Kafka / event streaming overkill
- broad cross-network attribution engine

---

## 2. Scope strategy

### Phase 1 = required foundation

Must exist before anything else:

- UTM capture
- fbclid capture
- session-level attribution persistence
- signup attribution binding
- browser Pixel registration event
- server CAPI registration event
- event deduplication via **one explicit server-defined event_id strategy**
- internal event storage
- simple internal attribution dashboard
- consent-aware send/skip logic

### Phase 2 = quality / activation signal

After Phase 1 works:

- activation events
- richer attribution table views
- event retry and delivery monitoring
- event status visibility in admin
- campaign quality analysis based on activation, not just registration

### Phase 3 = scaling features

Only after data quality exists:

- custom audience preparation
- advanced value events
- audience sync workflows
- delayed value feedback
- ZentraX reuse

---

## 3. Clean code and engineering standards

Claude must follow these rules.

### 3.1 Architecture principles

- Keep business logic separated from transport logic
- Keep Meta integration isolated behind service interfaces
- Keep event models strongly typed
- Prefer simple composition over magical abstractions
- Prefer explicit names over short clever names
- Keep code modular and testable
- Do not mix controller, persistence, and business logic in the same layer
- Use feature/domain grouping where it fits the existing repo structure
- Make every meaningful state transition observable and auditable

### 3.2 DRY rules

- Do not duplicate attribution parsing logic across frontend and backend
- Do not duplicate event payload building in multiple places
- Centralize Meta payload creation
- Centralize user attribution resolution
- Centralize consent gating rules
- Reuse event type definitions, enums, and interfaces

### 3.3 Maintainability rules

- No giant god service
- No hidden background magic without logs
- No “just throw everything into middleware”
- Every event must be traceable from source to delivery result
- Every important architectural decision must be documented
- Prefer small focused services over one mega “tracking manager”

### 3.4 Testing expectations

At minimum:

- unit tests for attribution parsing
- unit tests for first-touch prioritization
- unit tests for event_id generation
- unit tests for event payload builders
- unit tests for consent decision matrix behavior
- integration tests for signup attribution persistence
- integration tests for queue insertion and retry state transitions
- one explicit E2E deduplication proof scenario

---

## 4. Required feature set

### 4.1 Attribution capture on landing

On first landing, capture and persist if available:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `fbclid`
- landing URL
- referrer
- timestamp
- generated internal `landing_session_id`

Preferred storage strategy:

- first-party cookie or equivalent first-party storage
- backend persistence once session attribution is registered or bound during signup

### 4.2 Browser-side tracking

For consented marketing users:

- Meta Pixel page view
- Meta Pixel `CompleteRegistration`
- future Pixel activation events

### 4.3 Server-side tracking

On backend:

- Conversions API `CompleteRegistration`
- future activation events
- proper deduplication support
- request logging and retry-safe persistence

### 4.4 Deduplication (binding rule, no ambiguity)

This is mandatory and no alternative strategy should be implemented in v1.

#### Rule

For any deduplicated marketing event pair (browser + server):

- there is exactly **one logical event**
- there is exactly **one canonical event_id**
- that event_id is generated **server-side only**
- the same event_id is used by:
    - server-side Conversions API event
    - browser-side Pixel event

#### Canonical algorithm (required)

The v1 event_id algorithm is:

- namespace: fixed UUID namespace constant defined in code and documentation
- input string format: `{registration_transaction_id}:{user_id}:{event_name}`
- event_name for signup dedup in v1 must be exactly `CompleteRegistration`
- event_id = UUIDv5(namespace, input string)

#### Required ordering

The concatenation order must always be:

1. registration_transaction_id
2. user_id
3. event_name

#### Constraints

- `registration_transaction_id` must be stable and idempotent for the successful registration flow
- `user_id` must be the final persisted user identifier
- the frontend must never generate a substitute event_id
- the frontend must only use the canonical event_id returned by the backend

#### Goal

One registration must never become two logical registrations due to race conditions, retries, or inconsistent event_id generation.

### 4.5 User-level attribution

When a new user signs up, bind:

- user ID
- landing_session_id
- captured UTM data
- fbclid if present
- first-touch attribution timestamp

For v1:

- only first-touch attribution
- no last-touch model
- no multi-touch model

### 4.6 Event storage

Create an internal marketing event table for outgoing marketing events.

Must include:

- internal row ID
- user ID nullable
- landing_session_id nullable
- event name
- event source (`browser`, `server`, `internal`)
- canonical event_id
- payload snapshot or normalized columns
- consent state at send time
- send status (`pending`, `processing`, `sent`, `failed`, `skipped`)
- failure reason nullable
- last_error_code nullable
- provider_response_code nullable
- attempt_count
- next_retry_at nullable
- processing_started_at nullable
- lock_token nullable
- sent_at nullable
- created_at / updated_at

### 4.7 Internal dashboard

Build an internal admin dashboard showing at minimum:

#### Users table

- user id
- signup date
- acquisition source
- campaign
- ad content / creative where available
- fbclid presence
- activation status
- activation date if available

#### Events table

- event type
- event_id
- status
- source
- attempt count
- failure reason
- provider response code
- created at
- next retry at

#### Campaign view

- grouped by source/campaign/content
- registrations count
- activation count
- activation conversion rate

---

## 5. Event taxonomy

This is mandatory.
Do not improvise event names across the system.

### 5.1 v1 events

- `PageView`
- `CompleteRegistration`

### 5.2 v2 KeeperLog activation events

Only the following events are allowed to count as **qualifying activation events** for v1 KPI calculations:

- `AnimalProfileCreated`
- `FirstCareEntryCreated`

### 5.3 Optional later activation events

These may be added later, but do **not** count toward v1 KPI definitions unless the plan is explicitly revised:

- `FirstFeedingLogged`
- `FirstReminderCreated`
- `PublicProfileShared`

### 5.4 Event naming rules

Event names must be:

- stable
- human-readable
- product-safe
- not tied to temporary UI labels
- documented centrally

---

## 6. Attribution rules

This section is binding for v1.

### 6.1 Attribution model

Use **first-touch attribution only** in v1.

### 6.2 First-touch overwrite policy

Never overwrite a valid first-touch attribution with:

- `direct`
- `none`
- empty UTM set
- no-referrer fallback traffic

### 6.3 TTL for landing attribution

Landing attribution TTL:

- default: **30 days**

After TTL expiry:

- a new valid attributed landing may create a new landing attribution record
- but existing bound user attribution must not be retroactively changed

### 6.4 Priority order for candidate touches

When multiple candidate touches occur before signup and first-touch is not yet bound, prioritize:

1. paid traffic with valid campaign markers (`utm_source`, `utm_campaign`, or `fbclid`)
2. organic campaign-tagged traffic
3. non-direct referrer traffic
4. direct / none

### 6.5 Signup binding rule

At signup:

- bind the earliest still-valid highest-priority first-touch attribution candidate
- once bound, do not replace it in v1

### 6.6 Timezone rule

All attribution timestamps and dashboard cohorting in v1:

- stored in UTC
- dashboard grouping default = UTC

---

## 7. Consent decision matrix

This is mandatory and must be implemented explicitly.
Do not leave this implicit in helper logic.

### 7.1 Consent states

Supported states:

- `granted`
- `denied`
- `unknown`
- `revoked`

### 7.2 Rules by state

| Consent state | Internal attribution storage                                                 | Browser Pixel event | Server CAPI event | marketing_events row                  | Send status         |
| ------------- | ---------------------------------------------------------------------------- | ------------------- | ----------------- | ------------------------------------- | ------------------- |
| granted       | yes                                                                          | yes                 | yes               | yes                                   | pending/sent/failed |
| denied        | restricted operational fields only                                           | no                  | no                | yes if internal audit trail is needed | skipped             |
| unknown       | restricted operational fields only                                           | no                  | no                | yes if internal audit trail is needed | skipped             |
| revoked       | restricted operational fields only for new internal records; no new dispatch | no                  | no                | yes if internal audit trail is needed | skipped             |

### 7.3 Allowed field set for denied / unknown / revoked

When consent is not granted, the system may only persist the following minimum operational fields in `marketing_events`:

- internal row ID
- event_name
- event_source
- created_at
- updated_at
- consent_state
- status = `skipped`
- failure_reason or skip_reason
- attempt_count = `0`

The following fields must **not** be stored in marketing-dispatch records for denied / unknown / revoked states unless another documented legal basis explicitly exists:

- `fbclid`
- `fbc`
- `fbp`
- hashed email used for marketing matching
- Meta dispatch payload
- client IP copied for marketing dispatch
- user agent copied for marketing dispatch
- any marketing-ready external identifier

### 7.4 Operational interpretation

- internal operational logging may exist in a restricted form if necessary for product operation, fraud prevention, or security analysis
- optional marketing dispatch to Meta must never happen without the allowed consent state under your legal model
- consent state at event generation time must be stored with the event record

### 7.5 Claude requirement

Claude must not invent broader marketing dispatch permissions than defined here.
Any implementation uncertainty must be documented clearly.

---

## 8. Database design

Claude should adapt to actual repo/database style, but the v1 schema should conceptually include:

### 8.1 Table: `landing_attributions`

Fields:

- id
- landing_session_id
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term
- fbclid
- fbc nullable
- fbp nullable
- referrer
- landing_path
- first_seen_at
- expires_at
- created_at
- updated_at

#### Required constraints/indexes

- unique: `landing_session_id`
- index: `utm_source`, `utm_campaign`, `utm_content`
- index: `first_seen_at`
- index: `expires_at`

### 8.2 Table: `user_attributions`

Fields:

- id
- user_id
- landing_attribution_id
- attribution_model (`first_touch`)
- bound_at
- created_at
- updated_at

#### Required constraints/indexes

- unique: `user_id`, `attribution_model`
- index: `landing_attribution_id`
- index: `bound_at`

### 8.3 Table: `marketing_events`

Fields:

- id
- user_id nullable
- landing_session_id nullable
- event_name
- event_id
- event_source
- meta_enabled boolean
- consent_state
- payload json nullable
- status
- attempt_count
- next_retry_at nullable
- last_error_code nullable
- provider_response_code nullable
- failure_reason nullable
- processing_started_at nullable
- lock_token nullable
- sent_at nullable
- created_at
- updated_at

#### Required constraints/indexes

- required unique safeguard: `event_name`, `event_id`, `event_source`
- index: `status`, `next_retry_at`
- index: `user_id`
- index: `landing_session_id`
- index: `created_at`
- index: `event_name`, `status`

### 8.4 Table: `user_activation_events`

Fields:

- id
- user_id
- activation_type
- occurred_at
- metadata json nullable
- created_at

#### Required constraints/indexes

- index: `user_id`, `activation_type`
- index: `occurred_at`

---

## 9. Frontend requirements

### 9.1 Landing capture logic

On first app entry / landing page:

- parse URL params
- capture UTM params and fbclid
- generate `landing_session_id` if absent
- persist locally
- avoid overwriting valid first-touch attribution with weaker touches
- respect TTL logic
- expose helper for backend sync if needed

### 9.2 Registration flow integration

On successful signup:

- ensure attribution is linked or resolvable
- use backend-provided canonical `event_id`
- trigger browser tracking only if consent state = granted
- do not fire browser registration event with locally invented fallback IDs

### 9.3 Consent integration

Frontend must know:

- whether marketing tracking is allowed
- whether to skip Pixel entirely
- whether to suppress optional marketing identifier persistence

---

## 10. Backend requirements

### 10.1 Attribution binding endpoint or registration integration

Backend must:

- receive or resolve landing attribution
- persist it
- bind it to the new user
- record registration event in `marketing_events`

### 10.2 Meta Conversions API service

Create a dedicated service/module:

- isolated from controllers
- typed payload mapping
- retry-aware
- robust error handling
- structured logs
- easy to disable by environment flag
- dry-run capable

### 10.3 Event queue strategy

For v1:

- DB-backed queue only
- no external broker

Recommended behavior:

- registration writes marketing event row
- send attempt may occur synchronously only if safe
- failures remain in DB
- background retry job handles failed/pending events
- processing lock must prevent duplicate worker handling

### 10.4 Retry strategy

- limited retry count
- exponential backoff or bounded retry schedule
- clear failure statuses
- no silent drop
- `next_retry_at` required
- lock ownership required for processing-safe workers

---

## 11. Meta-specific implementation notes

### 11.1 Deduplication

Use one shared canonical event identity for browser + server registration events.
No alternative dedup pattern is allowed in v1.

### 11.2 Matching parameters

Where legally and technically allowed, support fields such as:

- external_id
- fbc
- fbp
- email hash if justified and permitted
- client_ip_address
- client_user_agent

Do not blindly send everything.
Only send what is justified, documented, and supported by your legal and consent model.

### 11.3 Dynamic parameter usage

The system must work with ad URLs containing campaign/content/source parameters.
Do not hardcode one ad platform forever.
Store normalized attribution fields in your own schema.

---

## 12. Internal dashboard requirements

### 12.1 v1 dashboard pages

#### Page A: Attribution overview

- signups by source
- signups by campaign
- signups by content / creative

#### Page B: User attribution list

- searchable table
- filters
- signup date
- attribution details
- activation status

#### Page C: Event delivery list

- event_name
- event_id
- status
- attempts
- failure reason
- payload preview
- next_retry_at

### 12.2 KPI definitions (binding for v1)

To avoid ambiguity, define v1 KPIs as:

- **Registration count** = users created during selected UTC date range
- **Activation count** = users with one of the allowed v1 qualifying activation events within **7 days after signup**
- **Allowed v1 qualifying activation events**:
    - `AnimalProfileCreated`
    - `FirstCareEntryCreated`
- **Activation conversion rate** = activation count / registration count
- **Campaign cohorting** = grouped by `signup_date` in UTC
- **Attribution grouping** = first-touch attribution only

### 12.3 Nice-to-have later

- time series charts
- activation funnel
- audience export prep
- LTV overlays
- per-campaign retention
- multiple attribution windows

---

## 13. Consent and privacy constraints

Claude must not assume tracking is always allowed.
Implementation must be consent-aware.

At minimum:

- if marketing consent is missing, browser Meta tracking must not fire
- if server-side marketing event sending is not allowed under the consent model, it must not dispatch
- internal audit/event records may still exist in restricted form, but must be clearly separated from ad-platform dispatch semantics
- consent state at event generation time must be stored

Do not hardcode privacy assumptions into random helpers.
Keep consent gating explicit, centralized, and auditable.

---

## 14. Legal/documentation consequences

This feature changes KeeperLog’s legal surface area.

Claude must leave clear notes for required documentation updates.

At minimum these legal areas will need review and likely updates:

- Privacy Policy
- Cookie Policy
- consent banner / consent manager configuration
- Terms of Service cross-reference consistency
- internal records of processing if you maintain them

Claude does not need to draft final legal text, but must document:

- what data is captured
- what identifiers are stored
- what is sent to Meta
- which events are browser-side vs server-side
- which parts depend on consent
- retention considerations

---

## 15. Logging and observability

Must have:

- structured logs for attribution binding
- structured logs for event dispatch
- failure reason capture
- admin visibility for failure states

Should have:

- environment flag to disable Meta sending in non-prod
- dry-run mode for payload validation
- payload redaction for sensitive fields in logs

---

## 16. Reusability for ZentraX

This plan is KeeperLog-first, but architecture must support ZentraX later.

That means:

- do not hardcode animal-specific assumptions into the tracking core
- keep product-specific activation events modular
- shared tracking core should support multiple products
- product-specific event definitions can extend a shared event system

Suggested structure:

- shared attribution core
- KeeperLog event mappings
- future ZentraX event mappings

---

## 17. Environment variables

Claude should explicitly document and implement a clean environment variable model.

Suggested v1 variables:

- `META_PIXEL_ENABLED`
- `META_CAPI_ENABLED`
- `META_CAPI_DRY_RUN`
- `META_PIXEL_ID`
- `META_ACCESS_TOKEN`
- `META_TEST_EVENT_CODE` (optional for testing)
- `TRACKING_ATTRIBUTION_TTL_DAYS`
- `TRACKING_MAX_RETRY_COUNT`
- `TRACKING_RETRY_BASE_DELAY_MS`
- `TRACKING_DISPATCH_TIMEOUT_MS`
- `TRACKING_CONSENT_MODE` (if applicable)
- `TRACKING_LOG_RETENTION_DAYS`
- `TRACKING_EVENT_RETENTION_DAYS`

Claude should adapt naming to the repo style if needed, but equivalent semantics must exist.

---

## 18. Claude execution order

Claude must not jump straight into coding.
Claude must follow this order:

### Step 1

Audit the existing repo and architecture.
Identify:

- frontend stack
- backend stack
- auth flow
- cookie/session approach
- existing analytics/tracking
- DB schema approach
- admin panel structure
- current consent handling if any

### Step 2

Refine this plan based on repo reality.
Do not blindly implement if the repo structure suggests a better path.

### Step 3

Write a technical design note before coding:

- data model decisions
- attribution persistence strategy
- event_id generation strategy
- consent gating strategy
- queue/retry design
- dashboard integration path

### Step 4

Implement Phase 1 only.

### Step 5

Verify:

- attribution persists
- signup is linked to attribution
- registration event stored
- event_id dedup flow coherent
- admin can inspect outcomes

### Step 6

Only then move to activation events and quality improvements.

---

## 19. Definition of done for v1

v1 is done only if all of the following are true:

- UTM and fbclid capture exists
- landing_session_id exists
- first-touch attribution rules are implemented explicitly
- signup is linked to attribution
- CompleteRegistration browser event exists
- CompleteRegistration server event exists
- dedup uses one canonical server-defined event_id
- marketing events are stored internally
- failed sends are visible
- consent matrix behavior is implemented
- internal dashboard shows user-by-campaign attribution
- campaign/content-level signup analysis exists
- KPI definitions are implemented consistently
- documentation is updated
- code is clean and maintainable

---

## 20. Explicit anti-patterns

Claude must avoid:

- hardcoding Meta logic directly into random controllers
- mixing attribution parsing with UI rendering logic
- sending events with no persistent audit trail
- duplicating event payload mapping everywhere
- inventing multiple attribution models in v1
- assuming “consent later”
- assuming “analytics later”
- implementing audience sync in v1
- shipping hidden tracking behavior with no documentation
- generating event IDs from multiple sources for the same logical event
- calling the system complete without admin visibility

---

## 21. Required documentation updates in repo

Claude must update or create:

- implementation notes
- event taxonomy documentation
- environment variable documentation
- admin dashboard notes
- rollout notes
- migration notes
- privacy-impact notes for internal review

---

## 22. Required E2E validation case

Claude must include at least one explicit E2E validation scenario:

### Scenario: one signup, one logical registration event

- a user lands with UTM + fbclid
- attribution is captured
- user signs up successfully
- backend creates canonical event_id
- browser receives canonical event_id
- browser event fires once
- server CAPI event fires once
- internal event storage shows coherent dedup pair
- admin dashboard shows one registration attributed to the correct campaign/content
- no duplicate logical registration is counted

This E2E scenario must be documented and, where practical, tested.

---

## 23. Future roadmap after v1

Do not build now unless explicitly requested, but design for:

### v2

- activation events
- campaign quality analysis
- event retry monitoring
- multi-product support

### v3

- audience exports
- audience sync
- delayed high-value conversion feedback
- richer ROI reporting
- activation-window configurability

### v4

- reusable internal marketing engine for KeeperLog + ZentraX + later products

---

## 24. Final instruction to Claude

Do not treat this as a generic tracking task.
Treat it as a product-quality marketing data backbone.

First refine this plan against the real repository.
Then implement Phase 1 cleanly.
Then document everything honestly.
Then stop and wait for review before Phase 2.
