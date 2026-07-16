import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TwinSilhouette } from "../src/index.js";

describe("TwinSilhouette", () => {
  it("renders an accessible neutral visual from measurements", () => {
    const html = renderToStaticMarkup(<TwinSilhouette measurements={{ height: { value: 170, unit: "cm" }, shoulder: { value: 42, unit: "cm" }, chest: { value: 90, unit: "cm" }, waist: { value: 72, unit: "cm" }, hip: { value: 96, unit: "cm" }, inseam: { value: 78, unit: "cm" } }} />);
    expect(html).toContain('role="img"');
    expect(html).toContain("neutral FitTwin silhouette");
  });
});
