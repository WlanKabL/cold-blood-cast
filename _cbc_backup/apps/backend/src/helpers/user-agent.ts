const BROWSER_PATTERNS: [RegExp, string][] = [
    [/Edg(?:e|A)?\//, "Edge"],
    [/OPR\/|Opera\//, "Opera"],
    [/Chrome\//, "Chrome"],
    [/Safari\//, "Safari"],
    [/Firefox\//, "Firefox"],
];

const OS_PATTERNS: [RegExp, string][] = [
    [/Android/, "Android"],
    [/iPhone|iPad|iPod/, "iOS"],
    [/Windows/, "Windows"],
    [/Macintosh|Mac OS/, "macOS"],
    [/Linux/, "Linux"],
];

export function normalizeUserAgent(ua: string): string {
    let browser = "Unknown";
    for (const [re, name] of BROWSER_PATTERNS) {
        if (re.test(ua)) {
            browser = name;
            break;
        }
    }

    let os = "Unknown";
    for (const [re, name] of OS_PATTERNS) {
        if (re.test(ua)) {
            os = name;
            break;
        }
    }

    return `${browser}:${os}`;
}
