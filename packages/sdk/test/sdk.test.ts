import { describe, expect, it } from "vitest";
import { createFitTwin, DeterministicStyleAdvisor } from "../src/index.js";

describe("FitTwin SDK", () => {
  it("does not contact an advisor unless one is configured", async () => {
    const sdk = createFitTwin();
    const profile = await sdk.createProfile({ id: "1", measurements: { height: { value: 170 }, shoulder: { value: 42 }, chest: { value: 90 }, waist: { value: 72 }, hip: { value: 96 }, inseam: { value: 78 } }, preferences: { goals: ["classic"], occasions: ["work"], avoid: [] } });
    await expect(sdk.generateStyleGuide(profile.id)).rejects.toThrow("No StyleAdvisor");
    expect(JSON.parse(await sdk.exportProfile(profile.id)).schemaVersion).toBe("1.0");
    await sdk.deleteProfile(profile.id);
    await expect(sdk.renderTwin(profile.id)).rejects.toThrow("was not found");
  });
  it("offers an offline guide without any provider credential", async () => {
    const sdk = createFitTwin({ advisor: new DeterministicStyleAdvisor() });
    await sdk.createProfile({ id: "offline", measurements: { height: { value: 170 }, shoulder: { value: 42 }, chest: { value: 90 }, waist: { value: 72 }, hip: { value: 96 }, inseam: { value: 78 } }, preferences: { goals: ["classic"], occasions: ["daily"], avoid: [] } });
    await expect(sdk.generateStyleGuide("offline")).resolves.toMatchObject({ silhouettes: expect.any(Array) });
  });
});
