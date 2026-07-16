import { describe, expect, it } from "vitest";
import { buildGuideInput, validateGuide } from "../src/guide.js";

const profilePayload = { id: "should-not-leave-device", measurements: { height: { value: 70, unit: "in" }, shoulder: { value: 44 }, chest: { value: 96 }, waist: { value: 78 }, hip: { value: 98 }, inseam: { value: 80 } }, preferences: { goals: ["classic"], occasions: ["daily"], avoid: [] }, feedback: [{ trait: "structured overshirt", sentiment: "like" }] };

describe("guide payload boundary", () => {
  it("creates a minimized, normalized request without a profile identifier", () => {
    const input = buildGuideInput(profilePayload);
    expect(JSON.stringify(input)).not.toContain("should-not-leave-device");
    expect(input.bodySummary.measurementsCm.height).toBe(177.8);
    expect(input.feedback).toEqual([{ trait: "structured overshirt", sentiment: "like" }]);
  });
  it("rejects malformed model responses", () => expect(() => validateGuide({ summary: "Too little" })).toThrow());
});
