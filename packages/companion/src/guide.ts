import { bodyMeasurementsSchema, calculateInsights, normalizeMeasurements, stylePreferencesSchema } from "@fittwin/core";
import { styleGuideSchema } from "@fittwin/sdk";

export function buildGuideInput(payload: unknown) {
  const candidate = payload as { measurements?: unknown; preferences?: unknown; feedback?: Array<{ trait?: unknown; sentiment?: unknown }> };
  const measurements = bodyMeasurementsSchema.parse(candidate.measurements);
  const preferences = stylePreferencesSchema.parse(candidate.preferences);
  return {
    bodySummary: { proportions: calculateInsights(measurements), measurementsCm: normalizeMeasurements(measurements) },
    preferences,
    feedback: (candidate.feedback ?? []).slice(-12).flatMap((item) => typeof item.trait === "string" && (item.sentiment === "like" || item.sentiment === "dislike") ? [{ trait: item.trait, sentiment: item.sentiment }] : [])
  };
}

export function validateGuide(value: unknown) { return styleGuideSchema.parse(value); }
