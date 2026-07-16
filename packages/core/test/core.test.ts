import { describe, expect, it } from "vitest";
import { assessGarmentFit, createProfile, renderTwin, toCm, validateProfileInput, type BodyMeasurements, type GarmentSpec } from "../src/index.js";

const measurements: BodyMeasurements = {
  height: { value: 175, unit: "cm" }, shoulder: { value: 44, unit: "cm" }, chest: { value: 96, unit: "cm" }, waist: { value: 78, unit: "cm" }, hip: { value: 98, unit: "cm" }, inseam: { value: 80, unit: "cm" }
};
const profile = createProfile({ id: "person-1", measurements, preferences: { goals: ["minimal"], occasions: ["daily"], fitPreference: "regular", avoid: [] } });

describe("FitTwin core", () => {
  it("normalizes inches to centimeters", () => expect(toCm({ value: 10, unit: "in" })).toBe(25.4));
  it("warns about impossible inseams", () => expect(validateProfileInput({ ...measurements, inseam: { value: 190, unit: "cm" } })).toContain("Inseam must be shorter than height."));
  it("renders neutral proportional data", () => expect(renderTwin(measurements).proportions.hip).toBe(1));
  it("recommends the closest top size with reasons", () => {
    const garment: GarmentSpec = { id: "tee", name: "Everyday tee", category: "top", fitIntent: "regular", sizes: [{ label: "S", measurements: { shoulder: 42, chest: 100 } }, { label: "M", measurements: { shoulder: 44, chest: 108 } }] };
    const result = assessGarmentFit(profile, garment);
    expect(result.recommendedSize).toBe("M");
    expect(result.reasons.join(" ")).toContain("chest");
  });
  it("reports missing category size data", () => {
    const garment: GarmentSpec = { id: "broken", name: "Broken chart", category: "bottom", fitIntent: "regular", sizes: [{ label: "M", measurements: { chest: 100 } }] };
    expect(assessGarmentFit(profile, garment).status).toBe("insufficient_data");
  });
  it("distinguishes acceptable and tight size charts", () => {
    const acceptable: GarmentSpec = { id: "roomy", name: "Roomy trouser", category: "bottom", fitIntent: "regular", sizes: [{ label: "M", measurements: { waist: 83, hip: 104, inseam: 80 } }] };
    const tight: GarmentSpec = { id: "tight", name: "Tight trouser", category: "bottom", fitIntent: "regular", sizes: [{ label: "M", measurements: { waist: 70, hip: 90, inseam: 78 } }] };
    expect(assessGarmentFit(profile, acceptable).status).toBe("acceptable");
    expect(assessGarmentFit(profile, tight).status).toBe("not_recommended");
  });
});
