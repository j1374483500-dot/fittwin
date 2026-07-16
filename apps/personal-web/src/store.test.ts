import { describe, expect, it } from "vitest";
import { createProfile } from "@fittwin/core";
import { IndexedDbGarmentStore, IndexedDbProfileStore, IndexedDbWardrobeStore } from "./store";

describe("local browser storage", () => {
  it("persists and erases a profile, wardrobe, and garment tables independently", async () => {
    const profiles = new IndexedDbProfileStore();
    const wardrobe = new IndexedDbWardrobeStore();
    const garments = new IndexedDbGarmentStore();
    const profile = createProfile({ id: "local-test", measurements: { height: { value: 170 }, shoulder: { value: 42 }, chest: { value: 90 }, waist: { value: 72 }, hip: { value: 96 }, inseam: { value: 78 } }, preferences: { goals: ["classic"], occasions: ["daily"], avoid: [] } });
    await profiles.set(profile);
    await wardrobe.set({ id: "shirt", name: "Shirt", category: "top", color: "white", formality: 3, warmth: 2, styleTags: ["classic"], createdAt: new Date().toISOString() });
    await garments.set({ id: "oxford", name: "Oxford", category: "top", fitIntent: "regular", sizes: [{ label: "M", measurements: { shoulder: 44, chest: 108 } }] });
    expect(await profiles.get("local-test")).toMatchObject({ id: "local-test" });
    expect(await wardrobe.list()).toHaveLength(1);
    expect(await garments.list()).toMatchObject([{ id: "oxford" }]);
    await profiles.clear(); await wardrobe.clear(); await garments.clear();
    expect(await profiles.get("local-test")).toBeUndefined();
    expect(await wardrobe.list()).toEqual([]);
    expect(await garments.list()).toEqual([]);
  });
});
