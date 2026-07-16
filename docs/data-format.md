# FitTwin data format

`TwinProfile` is versioned with `schemaVersion: "1.0"`. Measurements are supplied with a unit (`cm` or `in`) and normalized to centimetres for calculation. Required fields are `height`, `shoulder`, `chest`, `waist`, `hip`, and `inseam`; `torso`, `arm`, and `thigh` are optional.

FitTwin does not define, infer, or require gender, age, face data, health data, a photograph, or a real name. Consumers should preserve unknown fields externally rather than adding them to the public profile contract.

`GarmentSpec` accepts `top` and `bottom` charts. Tops should provide shoulder and chest; bottoms should provide waist, hip, and inseam. Each assessment returns a result status, confidence, recommendation, and per-area explanation. See [`examples/garment-specs.json`](../examples/garment-specs.json).
