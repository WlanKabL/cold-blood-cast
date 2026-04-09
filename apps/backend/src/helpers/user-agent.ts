/**
 * Extract browser family + OS from a user-agent string for stable fingerprinting.
 * Full UA strings change on every minor browser update, causing false "new device" alerts.
 */
export function normalizeUserAgent(ua: string): string {
    // Extract browser family
    let browser = "Unknown";
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
    else if (/Chrome\//i.test(ua)) browser = "Chrome";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";
    else if (/Safari\//i.test(ua)) browser = "Safari";

    // Extract OS (check mobile platforms first — iOS UAs contain "Mac OS X")
    let os = "Unknown";
    if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac OS X/i.test(ua)) os = "macOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    return `${browser}:${os}`;
}
