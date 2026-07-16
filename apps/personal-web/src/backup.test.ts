import { describe, expect, it } from "vitest";
import { createProfile } from "@fittwin/core";
import { decryptProfile, encryptProfile } from "./backup";

const profile = createProfile({ id: "backup", measurements: { height: { value: 170 }, shoulder: { value: 42 }, chest: { value: 90 }, waist: { value: 72 }, hip: { value: 96 }, inseam: { value: 78 } }, preferences: { goals: ["classic"], occasions: ["daily"], avoid: [] } });

describe("encrypted backup", () => {
  it("round-trips a profile without exposing plain JSON in ciphertext", async () => {
    const backup = await encryptProfile(profile, "long-enough-password");
    expect(backup.ciphertext).not.toContain("backup");
    await expect(decryptProfile(backup, "long-enough-password")).resolves.toMatchObject({ id: "backup" });
  });
  it("rejects an incorrect password", async () => {
    const backup = await encryptProfile(profile, "long-enough-password");
    await expect(decryptProfile(backup, "wrong-password")).rejects.toThrow("incorrect");
  });
});
