import { z } from "zod";

export const PROFILE_SCHEMA_VERSION = "1.0" as const;
export const styleGoals = ["minimal", "classic", "streetwear", "creative", "sport", "formal"] as const;
export const occasions = ["daily", "work", "date", "travel", "event"] as const;
export const fitPreferences = ["slim", "regular", "relaxed"] as const;
export const bodyParts = ["shoulder", "chest", "waist", "hip", "inseam"] as const;

export type Unit = "cm" | "in";
export type MeasurementKey = "height" | "shoulder" | "chest" | "waist" | "hip" | "inseam" | "torso" | "arm" | "thigh";
export type FitPreference = (typeof fitPreferences)[number];
export type GarmentCategory = "top" | "bottom";
export const wardrobeCategories = ["top", "bottom", "outerwear", "dress", "shoes", "accessory"] as const;
export type WardrobeCategory = (typeof wardrobeCategories)[number];

export const measurementInputSchema = z.object({
  value: z.number().positive("Measurement must be greater than zero"),
  unit: z.enum(["cm", "in"]).default("cm")
});

export const bodyMeasurementsSchema = z.object({
  height: measurementInputSchema,
  shoulder: measurementInputSchema,
  chest: measurementInputSchema,
  waist: measurementInputSchema,
  hip: measurementInputSchema,
  inseam: measurementInputSchema,
  torso: measurementInputSchema.optional(),
  arm: measurementInputSchema.optional(),
  thigh: measurementInputSchema.optional()
});

export const stylePreferencesSchema = z.object({
  goals: z.array(z.enum(styleGoals)).min(1),
  occasions: z.array(z.enum(occasions)).min(1),
  fitPreference: z.enum(fitPreferences).default("regular"),
  avoid: z.array(z.string().trim().min(1).max(80)).max(8).default([]),
  note: z.string().trim().max(240).optional()
});

export const twinProfileSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal(PROFILE_SCHEMA_VERSION),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  measurements: bodyMeasurementsSchema,
  preferences: stylePreferencesSchema,
  feedback: z.array(z.object({
    trait: z.string().min(1).max(48),
    sentiment: z.enum(["like", "dislike"]),
    createdAt: z.string().datetime()
  })).default([])
});

export type MeasurementInput = z.infer<typeof measurementInputSchema>;
export type BodyMeasurements = z.infer<typeof bodyMeasurementsSchema>;
export type StylePreferences = z.infer<typeof stylePreferencesSchema>;
export type TwinProfile = z.infer<typeof twinProfileSchema>;
export type BodyMeasurementsInput = z.input<typeof bodyMeasurementsSchema>;
export type StylePreferencesInput = z.input<typeof stylePreferencesSchema>;
export interface TwinProfileDraft {
  id: string;
  measurements: BodyMeasurementsInput;
  preferences: StylePreferencesInput;
  feedback?: TwinProfile["feedback"];
}

export const garmentSpecSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(["top", "bottom"]),
  fitIntent: z.enum(fitPreferences).default("regular"),
  sizes: z.array(z.object({
    label: z.string().min(1),
    measurements: z.object({
      shoulder: z.number().positive().optional(),
      chest: z.number().positive().optional(),
      waist: z.number().positive().optional(),
      hip: z.number().positive().optional(),
      inseam: z.number().positive().optional()
    })
  })).min(1)
});

export type GarmentSpec = z.infer<typeof garmentSpecSchema>;

export const wardrobeItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  category: z.enum(wardrobeCategories),
  color: z.string().min(1).max(40),
  formality: z.number().int().min(1).max(5).default(3),
  warmth: z.number().int().min(1).max(5).default(3),
  styleTags: z.array(z.enum(styleGoals)).max(3).default([]),
  createdAt: z.string().datetime()
});
export type WardrobeItem = z.infer<typeof wardrobeItemSchema>;
export const AGENT_VAULT_SCHEMA_VERSION = "1.0" as const;
/** A user-exported, local-only bundle used by the read-only FitTwin MCP server. */
export const agentVaultSchema = z.object({
  schemaVersion: z.literal(AGENT_VAULT_SCHEMA_VERSION),
  exportedAt: z.string().datetime(),
  profile: twinProfileSchema,
  wardrobe: z.array(wardrobeItemSchema).default([]),
  garments: z.array(garmentSpecSchema).default([])
});
export type AgentVault = z.infer<typeof agentVaultSchema>;
export const outfitContextSchema = z.object({
  occasion: z.enum(occasions).default("daily"),
  temperatureC: z.number().min(-30).max(50).default(20)
});
export type OutfitContext = z.infer<typeof outfitContextSchema>;
export interface OutfitRecommendation {
  status: "ready" | "needs_more_items";
  items: WardrobeItem[];
  reason: string;
  missing: WardrobeCategory[];
}

export interface NormalizedMeasurements { [key: string]: number | undefined; }
export interface RatioInsights {
  shoulderToHip: number;
  waistToHip: number;
  legToHeight: number;
  notes: string[];
}
export interface TwinViewModel {
  proportions: { shoulder: number; chest: number; waist: number; hip: number; leg: number };
  insights: RatioInsights;
}
export interface FitAssessment {
  status: "recommended" | "acceptable" | "not_recommended" | "insufficient_data";
  confidence: "high" | "medium" | "low";
  recommendedSize?: string;
  reasons: string[];
  areas: Array<{ area: "shoulder" | "chest" | "waist" | "hip" | "inseam"; differenceCm: number; status: "roomy" | "close" | "tight" }>;
}

const REQUIRED: MeasurementKey[] = ["height", "shoulder", "chest", "waist", "hip", "inseam"];
const IN_TO_CM = 2.54;

export function toCm(input: MeasurementInput): number {
  return input.unit === "in" ? round(input.value * IN_TO_CM) : round(input.value);
}

export function normalizeMeasurements(measurements: BodyMeasurements): NormalizedMeasurements {
  return Object.fromEntries(Object.entries(measurements).map(([key, value]) => [key, value ? toCm(value) : undefined]));
}

export function validateProfileInput(measurements: BodyMeasurements): string[] {
  const normalized = normalizeMeasurements(measurements);
  const warnings: string[] = [];
  for (const key of REQUIRED) if (!normalized[key]) warnings.push(`${key} is required.`);
  if ((normalized.height ?? 0) < 120 || (normalized.height ?? 0) > 230) warnings.push("Height is outside the usual range; check the unit before continuing.");
  if ((normalized.inseam ?? 0) >= (normalized.height ?? Infinity)) warnings.push("Inseam must be shorter than height.");
  return warnings;
}

export function createProfile(input: TwinProfileDraft, now = new Date()): TwinProfile {
  const timestamp = now.toISOString();
  return twinProfileSchema.parse({ ...input, schemaVersion: PROFILE_SCHEMA_VERSION, createdAt: timestamp, updatedAt: timestamp, feedback: input.feedback ?? [] });
}

export function calculateInsights(measurements: BodyMeasurements): RatioInsights {
  const m = normalizeMeasurements(measurements);
  const shoulderToHip = ratio(m.shoulder, m.hip);
  const waistToHip = ratio(m.waist, m.hip);
  const legToHeight = ratio(m.inseam, m.height);
  const notes = [
    shoulderToHip >= 0.94 ? "Your shoulder and hip widths read as balanced." : "Your lower half reads visually wider than your shoulder line.",
    waistToHip <= 0.8 ? "A defined waist can be highlighted when that feels like your style." : "Straight or softly structured layers can create a clean vertical line.",
    legToHeight >= 0.45 ? "Longer-looking leg proportions work well with cropped or tucked tops." : "Higher rises and a consistent trouser break can lengthen the visual line."
  ];
  return { shoulderToHip, waistToHip, legToHeight, notes };
}

export function renderTwin(measurements: BodyMeasurements): TwinViewModel {
  const m = normalizeMeasurements(measurements);
  const base = Math.max(m.hip ?? 1, 1);
  return {
    proportions: {
      shoulder: round((m.shoulder ?? base) / base),
      chest: round((m.chest ?? base) / base),
      waist: round((m.waist ?? base) / base),
      hip: 1,
      leg: round((m.inseam ?? 1) / Math.max(m.height ?? 1, 1))
    },
    insights: calculateInsights(measurements)
  };
}

/** A transparent, offline daily outfit suggestion from the user's own wardrobe. */
export function recommendOutfit(profile: Pick<TwinProfile, "preferences">, items: WardrobeItem[], context: OutfitContext): OutfitRecommendation {
  const validItems = items.map((item) => wardrobeItemSchema.parse(item));
  const pick = (category: WardrobeCategory) => validItems.filter((item) => item.category === category).sort((a, b) => scoreWardrobeItem(b, profile.preferences, context) - scoreWardrobeItem(a, profile.preferences, context))[0];
  const top = pick("top");
  const bottom = pick("bottom");
  const dress = pick("dress");
  const shoes = pick("shoes");
  const outerwear = context.temperatureC < 18 ? pick("outerwear") : undefined;
  const base = dress ? [dress] : [top, bottom].filter((item): item is WardrobeItem => Boolean(item));
  const selected = [...base, ...(outerwear ? [outerwear] : []), ...(shoes ? [shoes] : [])];
  const missing: WardrobeCategory[] = dress ? [] : (["top", "bottom"] as WardrobeCategory[]).filter((category) => !selected.some((item) => item.category === category));
  if (selected.length === 0 || missing.length > 0) return { status: "needs_more_items", items: selected, missing, reason: "Add a top and bottom, or a dress, to unlock a full daily outfit." };
  const names = selected.map((item) => item.name).join(" + ");
  const weather = context.temperatureC < 18 && !outerwear ? " Consider adding an outer layer for the temperature." : "";
  return { status: "ready", items: selected, missing: [], reason: `${names} aligns with your ${context.occasion} setting and saved style preferences.${weather}` };
}

const EASE: Record<GarmentCategory, Record<FitPreference, number>> = {
  top: { slim: 4, regular: 10, relaxed: 18 },
  bottom: { slim: 2, regular: 6, relaxed: 12 }
};

export function assessGarmentFit(profile: Pick<TwinProfile, "measurements" | "preferences">, garment: GarmentSpec): FitAssessment {
  garmentSpecSchema.parse(garment);
  const body = normalizeMeasurements(profile.measurements);
  const needed: Array<"shoulder" | "chest" | "waist" | "hip" | "inseam"> = garment.category === "top" ? ["shoulder", "chest"] : ["waist", "hip", "inseam"];
  const hasSizeData = garment.sizes.some((size) => needed.some((key) => size.measurements[key] !== undefined));
  if (!hasSizeData) return { status: "insufficient_data", confidence: "low", reasons: ["The garment size chart does not include the measurements needed for this category."], areas: [] };

  const preference = profile.preferences.fitPreference;
  const ease = EASE[garment.category][preference];
  const candidates = garment.sizes.map((size) => scoreSize(size, body, needed, ease));
  const best = candidates.sort((a, b) => b.score - a.score)[0];
  const hasCompleteData = needed.every((key) => body[key] && best.measurements[key] !== undefined);
  const status = best.tightAreas > 0 ? "not_recommended" : best.score >= 0.8 ? "recommended" : "acceptable";
  return {
    status,
    confidence: hasCompleteData ? "high" : "medium",
    recommendedSize: best.label,
    reasons: [
      `${best.label} is the closest match for a ${preference} ${garment.category} fit.`,
      ...best.areas.map((area) => `${area.area}: ${formatDifference(area.differenceCm)} cm of garment room (${area.status}).`)
    ],
    areas: best.areas
  };
}

function scoreSize(size: GarmentSpec["sizes"][number], body: NormalizedMeasurements, needed: Array<"shoulder" | "chest" | "waist" | "hip" | "inseam">, ease: number) {
  const areas = needed.flatMap((area) => {
    const garmentValue = size.measurements[area];
    const bodyValue = body[area];
    if (!garmentValue || !bodyValue) return [];
    const differenceCm = round(garmentValue - bodyValue);
    const expected = area === "shoulder" || area === "inseam" ? 0 : ease;
    return [{ area, differenceCm, status: differenceCm < 0 ? "tight" : differenceCm < expected * 0.55 ? "close" : "roomy" } as const];
  });
  const tightAreas = areas.filter((area) => area.status === "tight").length;
  const score = areas.length === 0 ? 0 : Math.max(0, areas.reduce((sum, area) => sum + Math.max(0, 1 - Math.abs(Math.max(area.differenceCm, 0) - ease) / Math.max(ease, 1)), 0) / areas.length - tightAreas * 0.5);
  return { ...size, areas, tightAreas, score };
}

function scoreWardrobeItem(item: WardrobeItem, preferences: StylePreferences, context: OutfitContext) {
  const styleScore = item.styleTags.filter((tag) => preferences.goals.includes(tag)).length * 3;
  const occasionTarget: Record<(typeof occasions)[number], number> = { daily: 2, work: 4, date: 3, travel: 2, event: 5 };
  const temperatureTarget = context.temperatureC < 10 ? 5 : context.temperatureC < 18 ? 4 : context.temperatureC < 25 ? 3 : 1;
  return styleScore - Math.abs(item.formality - occasionTarget[context.occasion]) - Math.abs(item.warmth - temperatureTarget) * 0.6;
}

function ratio(a?: number, b?: number) { return round((a ?? 0) / Math.max(b ?? 1, 1)); }
function round(value: number) { return Math.round(value * 100) / 100; }
function formatDifference(value: number) { return value > 0 ? `+${value}` : `${value}`; }
