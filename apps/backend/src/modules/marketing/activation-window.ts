// ─── Activation-window helpers ──────────────────────────────
// Plan v1.7 §12.2 / §23 — single source of truth for the
// "did this user activate within the configured window?" question.
//
// Used by: admin overview, ROI report, audience export.
// Bug history: previously each call site computed `now - 7d` which was
// always-empty for fresh cohorts. The correct rule is `boundAt + window`.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cutoff = boundAt + activationWindowDays (inclusive upper bound). */
export function activationCutoff(boundAt: Date, windowDays: number): Date {
    return new Date(boundAt.getTime() + windowDays * DAY_MS);
}

/**
 * Returns true if at least one activation event occurred between
 * `boundAt` and `boundAt + windowDays` (inclusive). Empty list → false.
 */
export function isActivatedWithinWindow(
    boundAt: Date,
    activationOccurrences: ReadonlyArray<{ occurredAt: Date }>,
    windowDays: number,
): boolean {
    const cutoff = activationCutoff(boundAt, windowDays);
    return activationOccurrences.some(
        (e) => e.occurredAt >= boundAt && e.occurredAt <= cutoff,
    );
}
