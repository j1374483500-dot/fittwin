import { assessGarmentFit, calculateInsights, createProfile, renderTwin, twinProfileSchema, type FitAssessment, type GarmentSpec, type TwinProfile, type TwinProfileDraft, type TwinViewModel } from "@fittwin/core";
import { z } from "zod";

export interface ProfileStore {
  get(id: string): Promise<TwinProfile | undefined>;
  set(profile: TwinProfile): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryProfileStore implements ProfileStore {
  #profiles = new Map<string, TwinProfile>();
  async get(id: string) { return this.#profiles.get(id); }
  async set(profile: TwinProfile) { this.#profiles.set(profile.id, profile); }
  async remove(id: string) { this.#profiles.delete(id); }
  async clear() { this.#profiles.clear(); }
}

export interface StyleAdvisor {
  generate(input: Pick<TwinProfile, "measurements" | "preferences" | "feedback">): Promise<StyleGuide>;
}

export const styleGuideSchema = z.object({
  summary: z.string().min(1).max(400),
  silhouettes: z.array(z.object({ recommendation: z.string().min(1).max(180), reason: z.string().min(1).max(300) })).min(1).max(4),
  layers: z.array(z.string().min(1).max(180)).max(5),
  outfitRecipes: z.array(z.object({ occasion: z.string().min(1).max(80), formula: z.string().min(1).max(240), reason: z.string().min(1).max(240) })).min(1).max(4),
  careNote: z.string().min(1).max(300)
});
export type StyleGuide = z.infer<typeof styleGuideSchema>;

/** Offline fallback that provides useful guidance without a provider key or network request. */
export class DeterministicStyleAdvisor implements StyleAdvisor {
  async generate(input: Pick<TwinProfile, "measurements" | "preferences" | "feedback">): Promise<StyleGuide> {
    const insights = calculateInsights(input.measurements);
    const primaryGoal = input.preferences.goals[0];
    const occasion = input.preferences.occasions[0];
    const liked = input.feedback.filter((item) => item.sentiment === "like").map((item) => item.trait).slice(-2);
    return styleGuideSchema.parse({
      summary: `A ${primaryGoal} direction built around your saved proportions and ${occasion} routine.`,
      silhouettes: [
        { recommendation: insights.legToHeight >= 0.45 ? "Try a cropped or tucked top with a clear waistline." : "Try a higher-rise bottom with a continuous vertical line.", reason: insights.notes[2] },
        { recommendation: insights.shoulderToHip >= 0.94 ? "Use straight layers when you want a balanced outline." : "Use a structured shoulder or lighter upper layer when you want visual balance.", reason: insights.notes[0] }
      ],
      layers: ["Start with one clean base layer.", "Add one layer only when it supports your comfort or the weather."],
      outfitRecipes: [{ occasion, formula: `${primaryGoal} top + comfortable bottom + one intentional shoe choice`, reason: liked.length ? `Your saved feedback favors ${liked.join(" and ")}.` : "This is an offline starting point you can refine with feedback." }],
      careNote: "This is a styling option, not a rule or a fit guarantee."
    });
  }
}

export interface FitTwin {
  createProfile(profile: TwinProfileDraft): Promise<TwinProfile>;
  updateProfile(id: string, update: Partial<Pick<TwinProfile, "measurements" | "preferences" | "feedback">>): Promise<TwinProfile>;
  getProfile(id: string): Promise<TwinProfile | undefined>;
  renderTwin(id: string): Promise<TwinViewModel>;
  generateStyleGuide(id: string): Promise<StyleGuide>;
  assessGarmentFit(id: string, garment: GarmentSpec): Promise<FitAssessment>;
  exportProfile(id: string): Promise<string>;
  deleteProfile(id: string): Promise<void>;
}

export function createFitTwin(options: { store?: ProfileStore; advisor?: StyleAdvisor } = {}): FitTwin {
  const store = options.store ?? new MemoryProfileStore();
  const requireProfile = async (id: string) => {
    const profile = await store.get(id);
    if (!profile) throw new Error(`FitTwin profile ${id} was not found.`);
    return profile;
  };
  return {
    async createProfile(input) { const profile = createProfile(input); await store.set(profile); return profile; },
    async updateProfile(id, update) {
      const current = await requireProfile(id);
      const profile = twinProfileSchema.parse({ ...current, ...update, updatedAt: new Date().toISOString() });
      await store.set(profile); return profile;
    },
    getProfile: (id) => store.get(id),
    async renderTwin(id) { return renderTwin((await requireProfile(id)).measurements); },
    async generateStyleGuide(id) {
      if (!options.advisor) throw new Error("No StyleAdvisor is configured. FitTwin does not send body data without an explicit advisor.");
      const profile = await requireProfile(id);
      return options.advisor.generate(profile);
    },
    async assessGarmentFit(id, garment) { return assessGarmentFit(await requireProfile(id), garment); },
    async exportProfile(id) { return JSON.stringify(await requireProfile(id), null, 2); },
    deleteProfile: (id) => store.remove(id)
  };
}
