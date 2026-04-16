import { describe, it, expect } from "vitest";
import {
    enclosureTypeBadge,
    sensorTypeBadge,
    genderBadge,
    alertConditionBadge,
    statusBadge,
    statusDot,
    jobStatusColor,
} from "../badges";

describe("enclosureTypeBadge", () => {
    it("returns emerald for TERRARIUM", () => {
        expect(enclosureTypeBadge("TERRARIUM")).toContain("text-emerald-400");
    });
    it("returns primary for VIVARIUM", () => {
        expect(enclosureTypeBadge("VIVARIUM")).toContain("text-primary-400");
    });
    it("returns cyan for PALUDARIUM", () => {
        expect(enclosureTypeBadge("PALUDARIUM")).toContain("text-cyan-400");
    });
    it("returns amber for RACK", () => {
        expect(enclosureTypeBadge("RACK")).toContain("text-amber-400");
    });
    it("returns zinc for OTHER", () => {
        expect(enclosureTypeBadge("OTHER")).toContain("text-zinc-400");
    });
    it("returns zinc fallback for unknown", () => {
        expect(enclosureTypeBadge("UNKNOWN")).toContain("text-zinc-400");
    });
});

describe("sensorTypeBadge", () => {
    it("returns red for TEMPERATURE", () => {
        expect(sensorTypeBadge("TEMPERATURE")).toContain("text-red-400");
    });
    it("returns cyan for HUMIDITY", () => {
        expect(sensorTypeBadge("HUMIDITY")).toContain("text-cyan-400");
    });
    it("returns purple for PRESSURE", () => {
        expect(sensorTypeBadge("PRESSURE")).toContain("text-purple-400");
    });
    it("returns blue for WATER", () => {
        expect(sensorTypeBadge("WATER")).toContain("text-blue-400");
    });
    it("returns amber for LIGHT", () => {
        expect(sensorTypeBadge("LIGHT")).toContain("text-amber-400");
    });
    it("returns zinc fallback for unknown", () => {
        expect(sensorTypeBadge("X")).toContain("text-zinc-400");
    });
});

describe("genderBadge", () => {
    it("returns blue for MALE", () => {
        expect(genderBadge("MALE")).toContain("text-blue-400");
    });
    it("returns pink for FEMALE", () => {
        expect(genderBadge("FEMALE")).toContain("text-pink-400");
    });
    it("returns zinc for UNKNOWN", () => {
        expect(genderBadge("UNKNOWN")).toContain("text-zinc-400");
    });
});

describe("alertConditionBadge", () => {
    it("returns red for ABOVE", () => {
        expect(alertConditionBadge("ABOVE")).toContain("text-red-400");
    });
    it("returns blue for BELOW", () => {
        expect(alertConditionBadge("BELOW")).toContain("text-blue-400");
    });
    it("returns emerald for OUTSIDE_RANGE", () => {
        expect(alertConditionBadge("OUTSIDE_RANGE")).toContain("text-emerald-400");
    });
});

describe("statusBadge", () => {
    it("returns emerald for ACTIVE", () => {
        expect(statusBadge("ACTIVE")).toContain("text-emerald-400");
    });
    it("returns emerald for OK", () => {
        expect(statusBadge("OK")).toContain("text-emerald-400");
    });
    it("returns amber for WARNING", () => {
        expect(statusBadge("WARNING")).toContain("text-amber-400");
    });
    it("returns red for CRITICAL", () => {
        expect(statusBadge("CRITICAL")).toContain("text-red-400");
    });
    it("returns zinc for OFFLINE", () => {
        expect(statusBadge("OFFLINE")).toContain("text-zinc-400");
    });
    it("returns zinc fallback for unknown", () => {
        expect(statusBadge("WHATEVER")).toContain("text-zinc-400");
    });
});

describe("statusDot", () => {
    it("returns emerald pulse for ACTIVE", () => {
        expect(statusDot("ACTIVE")).toContain("bg-emerald-400");
        expect(statusDot("ACTIVE")).toContain("animate-pulse");
    });
    it("returns red pulse for ERROR", () => {
        expect(statusDot("ERROR")).toContain("bg-red-400");
    });
    it("returns zinc without pulse for OFFLINE", () => {
        expect(statusDot("OFFLINE")).toBe("bg-zinc-400");
    });
});

describe("jobStatusColor", () => {
    it("returns emerald for COMPLETED", () => {
        expect(jobStatusColor("COMPLETED")).toBe("text-emerald-400");
    });
    it("returns red for FAILED", () => {
        expect(jobStatusColor("FAILED")).toBe("text-red-400");
    });
    it("returns primary for QUEUED", () => {
        expect(jobStatusColor("QUEUED")).toBe("text-primary-400");
    });
    it("returns faint fallback for unknown", () => {
        expect(jobStatusColor("X")).toBe("text-fg-faint");
    });
});
