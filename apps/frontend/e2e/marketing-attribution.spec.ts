import { test, expect, type Request } from "@playwright/test";
import { mockNoAuth } from "./helpers/mock-auth";

const CANONICAL_EVENT_ID = "deadbeef-1111-5222-9333-444455556666";
const LANDING_SID = "11111111-1111-4111-8111-111111111111";

test.describe("Marketing Attribution Flow", () => {
    test.beforeEach(async ({ page }) => {
        await mockNoAuth(page);
        await page.route("**/api/auth/platform-status", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: { maintenance: false, registrationMode: "open" },
                }),
            }),
        );
    });

    test("captures landing UTM/fbclid and POSTs to /api/marketing/landing", async ({ page }) => {
        await page.route("**/api/marketing/landing", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        landingSessionId: "ignored",
                        expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
                    },
                }),
            }),
        );

        const [landingReq] = await Promise.all([
            page.waitForRequest(
                (req) => req.url().includes("/api/marketing/landing") && req.method() === "POST",
                { timeout: 15_000 },
            ),
            page.goto(
                "/?utm_source=meta&utm_medium=cpc&utm_campaign=spring2026&utm_content=ad-a&fbclid=fb_xyz",
            ),
        ]);

        const body = landingReq.postDataJSON() as Record<string, unknown>;
        expect(body.utmSource).toBe("meta");
        expect(body.utmMedium).toBe("cpc");
        expect(body.utmCampaign).toBe("spring2026");
        expect(body.utmContent).toBe("ad-a");
        expect(body.fbclid).toBe("fb_xyz");
        expect(typeof body.landingSessionId).toBe("string");

        // Plugin must have stored the landing session for later signup binding.
        const stored = await page.evaluate(() =>
            window.localStorage.getItem("cbc-landing-attribution"),
        );
        expect(stored).not.toBeNull();
    });

    test("v3.1: captures extended attribution params (utm_id, adset_*, gclid)", async ({
        page,
    }) => {
        await page.route("**/api/marketing/landing", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        landingSessionId: "ignored",
                        expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
                    },
                }),
            }),
        );

        const [landingReq] = await Promise.all([
            page.waitForRequest(
                (req) => req.url().includes("/api/marketing/landing") && req.method() === "POST",
                { timeout: 15_000 },
            ),
            page.goto(
                "/?utm_source=facebook&utm_medium=paidsocial&utm_campaign=Spring%20Promo&utm_content=120210000123&utm_id=1203456789&adset_id=9988776655&adset_name=Lookalike%20DE%201&gclid=Cj0KCQiA-test",
            ),
        ]);

        const body = landingReq.postDataJSON() as Record<string, unknown>;
        expect(body.utmId).toBe("1203456789");
        expect(body.adsetId).toBe("9988776655");
        expect(body.adsetName).toBe("Lookalike DE 1");
        expect(body.gclid).toBe("Cj0KCQiA-test");
        // Original v1 params still flow through.
        expect(body.utmSource).toBe("facebook");
        expect(body.utmContent).toBe("120210000123");
    });

    test("does NOT re-POST on second landing without new markers (idempotent)", async ({
        page,
    }) => {
        // Pre-seed a stored landing session so the plugin treats this as a return visit.
        await page.addInitScript(() => {
            window.localStorage.setItem(
                "cbc-landing-attribution",
                JSON.stringify({
                    landingSessionId: "11111111-1111-4111-8111-111111111111",
                    capturedAt: Date.now(),
                }),
            );
        });

        let landingPostCount = 0;
        await page.route("**/api/marketing/landing", (route) => {
            landingPostCount += 1;
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        landingSessionId: "ignored",
                        expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
                    },
                }),
            });
        });

        await page.goto("/");
        await page.waitForTimeout(500);
        // No marketing markers + already-stored session → must not POST again.
        expect(landingPostCount).toBe(0);
    });

    test("registration sends landingSessionId + marketingConsent and fires Pixel with canonical eventId", async ({
        page,
    }) => {
        // Pre-seed landing attribution + cookie consent (granted) in localStorage.
        await page.addInitScript(
            ({ sid }) => {
                window.localStorage.setItem(
                    "cbc-landing-attribution",
                    JSON.stringify({
                        landingSessionId: sid,
                        utmSource: "meta",
                        utmMedium: "cpc",
                        utmCampaign: "spring2026",
                        utmContent: "ad-a",
                        fbclid: "fb_xyz",
                        referrer: "https://facebook.com/",
                        landingPath: "/",
                        capturedAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 30 * 86400_000).toISOString(),
                    }),
                );
                window.localStorage.setItem(
                    "cbc-cookie-consent",
                    JSON.stringify({
                        version: 2,
                        analytics: true,
                        marketing: true,
                        timestamp: new Date().toISOString(),
                    }),
                );
                // Stub fbq so the plugin doesn't actually load Facebook's script.
                (window as unknown as { fbq: unknown }).fbq = Object.assign(
                    function fbqStub(...args: unknown[]) {
                        ((window as unknown as { __fbqCalls: unknown[] }).__fbqCalls ||= []).push(
                            args,
                        );
                    },
                    { loaded: true, version: "2.0", queue: [] },
                );
            },
            { sid: LANDING_SID },
        );

        // Mock the register endpoint and capture the request body.
        await page.route("**/api/auth/register", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: "usr_new_001",
                            username: "newkeeper",
                            email: "new@example.com",
                            displayName: null,
                            avatarUrl: null,
                            createdAt: new Date().toISOString(),
                            emailVerified: false,
                            onboardingCompleted: false,
                            locale: "en",
                        },
                        tokens: {
                            accessToken: "mock-access",
                            refreshToken: "mock-refresh",
                        },
                        marketingDispatch: {
                            eventId: CANONICAL_EVENT_ID,
                            eventName: "CompleteRegistration",
                            browserDispatchAllowed: true,
                        },
                        pendingApproval: false,
                    },
                }),
            }),
        );
        // After register, the auth store calls fetchMe — stub it to succeed.
        await page.route("**/api/auth/me", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: "usr_new_001",
                            username: "newkeeper",
                            email: "new@example.com",
                            displayName: null,
                            avatarUrl: null,
                            createdAt: new Date().toISOString(),
                            emailVerified: true,
                            onboardingCompleted: true,
                            locale: "en",
                        },
                        roles: ["user"],
                        features: {},
                        limits: {},
                        enabledFlags: [],
                        featureTiers: {},
                        impersonatedBy: null,
                    },
                }),
            }),
        );

        // Capture the browser-delivered confirmation POST via waitForRequest.
        await page.route("**/api/marketing/events/*/browser-delivered", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: { ok: true } }),
            }),
        );

        // Avoid a second landing POST during this test.
        await page.route("**/api/marketing/landing", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: { landingSessionId: LANDING_SID, expiresAt: new Date().toISOString() },
                }),
            }),
        );

        await page.goto("/register");

        // Fill the form. Selectors are tolerant of label variations.
        await page.locator("input[type='text'], input[name*='user']").first().fill("newkeeper");
        await page.locator("input[type='email']").first().fill("new@example.com");
        const pwInputs = page.locator("input[type='password']");
        await pwInputs.nth(0).fill("Sup3rSecur3!Pa55");
        await pwInputs.nth(1).fill("Sup3rSecur3!Pa55");

        // Tick the ToS checkbox (uses role=checkbox).
        await page.getByRole("checkbox").first().check();

        const submitBtn = page.getByRole("button", {
            name: /create account|register|registrieren|sign up|konto erstellen/i,
        });
        await expect(submitBtn).toBeEnabled({ timeout: 15_000 });

        const [registerReq] = await Promise.all([
            page.waitForRequest(
                (req) => req.url().includes("/api/auth/register") && req.method() === "POST",
                { timeout: 15_000 },
            ),
            submitBtn.click(),
        ]);

        const body = registerReq.postDataJSON() as Record<string, unknown>;
        expect(body.landingSessionId).toBe(LANDING_SID);
        expect(body.marketingConsent).toBe("granted");

        // Wait for the browser-delivered confirmation POST and extract eventId from URL.
        const browserDeliveredReq = await page.waitForRequest(
            (req) =>
                /\/api\/marketing\/events\/[^/]+\/browser-delivered$/.test(req.url()) &&
                req.method() === "POST",
            { timeout: 10_000 },
        );
        const matchUrl = browserDeliveredReq.url().match(/\/events\/([^/]+)\/browser-delivered/);
        expect(matchUrl?.[1]).toBe(CANONICAL_EVENT_ID);

        // Confirm fbq was called with the canonical eventID for Pixel/CAPI dedup.
        const fbqCalls = await page.evaluate(
            () => (window as unknown as { __fbqCalls?: unknown[] }).__fbqCalls ?? [],
        );
        const trackCall = (fbqCalls as unknown[][]).find(
            (c) => c[0] === "track" && c[1] === "CompleteRegistration",
        );
        expect(trackCall).toBeDefined();
        expect((trackCall as unknown[])[3]).toMatchObject({ eventID: CANONICAL_EVENT_ID });
    });

    test("registration without marketing consent does NOT fire browser pixel", async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem(
                "cbc-cookie-consent",
                JSON.stringify({
                    version: 2,
                    analytics: false,
                    marketing: false,
                    timestamp: new Date().toISOString(),
                }),
            );
            (window as unknown as { fbq: unknown }).fbq = Object.assign(
                function fbqStub(...args: unknown[]) {
                    ((window as unknown as { __fbqCalls: unknown[] }).__fbqCalls ||= []).push(args);
                },
                { loaded: true, version: "2.0", queue: [] },
            );
        });

        await page.route("**/api/marketing/landing", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        landingSessionId: LANDING_SID,
                        expiresAt: new Date().toISOString(),
                    },
                }),
            }),
        );

        await page.route("**/api/auth/register", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: "usr_new_002",
                            username: "denieduser",
                            email: "denied@example.com",
                            displayName: null,
                            avatarUrl: null,
                            createdAt: new Date().toISOString(),
                            emailVerified: false,
                            onboardingCompleted: false,
                            locale: "en",
                        },
                        tokens: { accessToken: "mock-access", refreshToken: "mock-refresh" },
                        // Backend signals: persisted as audit row, no browser dispatch.
                        marketingDispatch: {
                            eventId: CANONICAL_EVENT_ID,
                            eventName: "CompleteRegistration",
                            browserDispatchAllowed: false,
                        },
                        pendingApproval: false,
                    },
                }),
            }),
        );
        await page.route("**/api/auth/me", (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    success: true,
                    data: {
                        user: {
                            id: "usr_new_002",
                            username: "denieduser",
                            email: "denied@example.com",
                            displayName: null,
                            avatarUrl: null,
                            createdAt: new Date().toISOString(),
                            emailVerified: true,
                            onboardingCompleted: true,
                            locale: "en",
                        },
                        roles: ["user"],
                        features: {},
                        limits: {},
                        enabledFlags: [],
                        featureTiers: {},
                        impersonatedBy: null,
                    },
                }),
            }),
        );

        let browserDeliveredCalled = false;
        await page.route("**/api/marketing/events/*/browser-delivered", (route) => {
            browserDeliveredCalled = true;
            return route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true, data: { ok: true } }),
            });
        });

        await page.goto("/register");
        await page.locator("input[type='text'], input[name*='user']").first().fill("denieduser");
        await page.locator("input[type='email']").first().fill("denied@example.com");
        const pwInputs = page.locator("input[type='password']");
        await pwInputs.nth(0).fill("Sup3rSecur3!Pa55");
        await pwInputs.nth(1).fill("Sup3rSecur3!Pa55");

        await page.getByRole("checkbox").first().check();

        const submitBtn = page.getByRole("button", {
            name: /create account|register|registrieren|sign up|konto erstellen/i,
        });
        await expect(submitBtn).toBeEnabled({ timeout: 15_000 });

        const [registerReq2] = await Promise.all([
            page.waitForRequest(
                (req) => req.url().includes("/api/auth/register") && req.method() === "POST",
                { timeout: 15_000 },
            ),
            submitBtn.click(),
        ]);
        // Sanity: verify the request really did fire.
        expect(registerReq2.method()).toBe("POST");

        // Give any background tasks a moment.
        await page.waitForTimeout(800);

        const fbqCalls = await page.evaluate(
            () => (window as unknown as { __fbqCalls?: unknown[] }).__fbqCalls ?? [],
        );
        const trackCall = (fbqCalls as unknown[][]).find(
            (c) => c[0] === "track" && c[1] === "CompleteRegistration",
        );
        expect(trackCall).toBeUndefined();
        expect(browserDeliveredCalled).toBe(false);
    });
});
