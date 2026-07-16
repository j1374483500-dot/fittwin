import { describe, expect, it } from "vitest";
import { createProfile } from "@fittwin/core";
import { IndexedDbProfileStore, IndexedDbWardrobeStore } from "./store";

describe("local browser storage", () => {
  it("persists and erases a profile and wardrobe independently", async () => {
    const profiles = new IndexedDbProfileStore();
    const wardrobe = new IndexedDbWardrobeStore();
    const profile = createProfile({ id: "local-test", measurements: { height: { value: 170 }, shoulder: { value: 42 }, chest: { value: 90 }, waist: { value: 72 }, hip: { value: 96 }, inseam: { value: 78 } }, preferences: { goals: ["classic"], occasions: ["daily"], avoid: [] } });
    await profiles.set(profile);
    await wardrobe.set({ id: "shirt", name: "Shirt", category: "top", color: "white", formality: 3, warmth: 2, styleTags: ["classic"], createdAt: new Date().toISOString() });
    expect(await profiles.get("local-test")).toMatchObject({ id: "local-test" });
    expect(await wardrobe.list()).toHaveLength(1);
    await profiles.clear(); await wardrobe.clear();
    expect(await profiles.get("local-test")).toBeUndefined();
    expect(await wardrobe.list()).toEqual([]);
  });
});
