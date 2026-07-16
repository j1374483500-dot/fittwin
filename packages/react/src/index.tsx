import type { CSSProperties } from "react";
import { renderTwin, type BodyMeasurements } from "@fittwin/core";

export interface TwinSilhouetteProps { measurements: BodyMeasurements; label?: string; }

/** A neutral, data-derived silhouette. It does not model a face, identity, or body scan. */
export function TwinSilhouette({ measurements, label = "Your neutral FitTwin silhouette" }: TwinSilhouetteProps) {
  const { proportions } = renderTwin(measurements);
  const scale = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const shoulder = scale(proportions.shoulder * 70, 54, 90);
  const chest = scale(proportions.chest * 58, 48, 86);
  const waist = scale(proportions.waist * 58, 42, 82);
  const leg = scale(proportions.leg * 160, 62, 96);
  const style = { "--shoulder": `${shoulder}px`, "--chest": `${chest}px`, "--waist": `${waist}px`, "--hip": "58px", "--leg": `${leg}px` } as CSSProperties;
  return <div className="fittwin-silhouette" style={style} aria-label={label} role="img"><div className="fittwin-head" /><div className="fittwin-shoulders" /><div className="fittwin-chest" /><div className="fittwin-waist" /><div className="fittwin-hips" /><div className="fittwin-legs"><i /><i /></div></div>;
}

export const twinSilhouetteCss = ".fittwin-silhouette{position:relative;width:190px;height:360px;margin-inline:auto;display:flex;align-items:center;flex-direction:column;color:inherit}.fittwin-head{width:42px;height:50px;border:2px solid currentColor;border-radius:48% 48% 44% 44%;margin-bottom:8px}.fittwin-shoulders{width:var(--shoulder);height:30px;border:2px solid currentColor;border-bottom:0;border-radius:45% 45% 0 0}.fittwin-chest{width:var(--chest);height:48px;border:2px solid currentColor;border-block:0;clip-path:polygon(0 0,100% 0,89% 100%,11% 100%)}.fittwin-waist{width:var(--waist);height:38px;border:2px solid currentColor;border-block:0;clip-path:polygon(11% 0,89% 0,100% 100%,0 100%)}.fittwin-hips{width:var(--hip);height:28px;border:2px solid currentColor;border-block:0;border-radius:0 0 22% 22%}.fittwin-legs{height:var(--leg);width:calc(var(--hip) - 10px);display:flex;justify-content:space-between}.fittwin-legs i{display:block;width:calc(50% - 4px);height:100%;border-inline:2px solid currentColor;border-bottom:2px solid currentColor;border-radius:0 0 14px 14px}";
