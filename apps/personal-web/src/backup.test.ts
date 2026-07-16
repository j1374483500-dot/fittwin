import { describe, expect, it } from "vitest";
import { createProfile, type AgentVault } from "@fittwin/core";
import { decryptAgentVault, decryptProfile, encryptAgentVault, encryptProfile } from "./backup";

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
  it("round-trips an encrypted agent vault containing only user-exported local data", async () => {
    const vault: AgentVault = { schemaVersion: "1.0", exportedAt: new Date().toISOString(), profile, wardrobe: [{ id: "shirt", name: "Shirt", category: "top", color: "white", formality: 3, warmth: 2, styleTags: ["classic"], createdAt: new Date().toISOString() }], garments: [] };
    const backup = await encryptAgentVault(vault, "long-enough-password");
    expect(backup.ciphertext).not.toContain("Shirt");
    await expect(decryptAgentVault(backup, "long-enough-password")).resolves.toMatchObject({ profile: { id: "backup" }, wardrobe: [{ id: "shirt" }] });
  });
});
