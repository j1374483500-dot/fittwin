#!/usr/bin/env node
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomBytes } from "node:crypto";
import { buildGuideInput, validateGuide } from "./guide.js";

const port = Number(process.env.FITTWIN_PORT ?? 47831);
const apiKey = process.env.FITTWIN_API_KEY;
const baseUrl = (process.env.FITTWIN_BASE_URL ?? "").replace(/\/$/, "");
const model = process.env.FITTWIN_MODEL;
const token = process.env.FITTWIN_PAIRING_TOKEN ?? randomBytes(20).toString("base64url");
const permittedOrigin = process.env.FITTWIN_ORIGIN;

if (!apiKey || !baseUrl || !model) {
  console.error("FitTwin companion requires FITTWIN_API_KEY, FITTWIN_BASE_URL, and FITTWIN_MODEL. See .env.example.");
  process.exit(1);
}

createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && !isPermittedOrigin(origin)) return send(response, 403, { error: "This origin is not allowed by the local companion." });
  if (origin) response.setHeader("access-control-allow-origin", origin);
  response.setHeader("vary", "Origin");
  response.setHeader("access-control-allow-headers", "content-type, x-fittwin-token");
  if (request.method === "OPTIONS") { response.writeHead(204); return response.end(); }
  if (request.method !== "POST" || request.url !== "/v1/style-guide") return send(response, 404, { error: "Not found." });
  if (request.headers["x-fittwin-token"] !== token) return send(response, 401, { error: "Invalid pairing token." });
  try {
    const guide = await requestGuide(await readJson(request));
    return send(response, 200, guide);
  } catch (error) {
    return send(response, 400, { error: error instanceof Error ? error.message : "Unable to generate a guide." });
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`FitTwin local companion listening at http://127.0.0.1:${port}`);
  console.log(`Pairing token: ${token}`);
  console.log("The API key is read from this process only and is never stored by FitTwin.");
});

export async function requestGuide(payload: unknown) {
  const input = buildGuideInput(payload);
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.7, response_format: { type: "json_object" }, messages: [
      { role: "system", content: "You are FitTwin, an inclusive personal style guide. Return only valid JSON with summary, silhouettes, layers, outfitRecipes, and careNote. Never shame a body, rank bodies, make health claims, diagnose conditions, or promise fit. Describe visual options and trade-offs in a respectful, non-gendered tone." },
      { role: "user", content: JSON.stringify(input) }
    ] })
  });
  if (!response.ok) throw new Error(`Model provider returned ${response.status}.`);
  const completion = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error("Model provider returned no guide content.");
  return validateGuide(JSON.parse(content));
}

function isPermittedOrigin(origin: string) { return origin === permittedOrigin || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin); }
function readJson(request: IncomingMessage) { return new Promise<unknown>((resolve, reject) => { let body = ""; request.on("data", (chunk) => { body += chunk; if (body.length > 65536) request.destroy(new Error("Request body is too large.")); }); request.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Request body must be valid JSON.")); } }); request.on("error", reject); }); }
function send(response: ServerResponse, status: number, data: unknown) { response.writeHead(status, { "content-type": "application/json; charset=utf-8" }); response.end(JSON.stringify(data)); }
