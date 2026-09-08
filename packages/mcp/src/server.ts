#!/usr/bin/env node
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { agentVaultSchema, assessGarmentFit, calculateInsights, garmentSpecSchema, recommendOutfit, type AgentVault } from "@fittwin/core";
import { DeterministicStyleAdvisor } from "@fittwin/sdk";
import { z } from "zod";

const encryptedVaultSchema = z.object({ version: z.literal(1), salt: z.string().min(1), iv: z.string().min(1), ciphertext: z.string().min(17) });

export function profileSummary(vault: AgentVault) {
  const insights = calculateInsights(vault.profile.measurements);
  return {
    schemaVersion: "1.0",
    preferences: vault.profile.preferences,
    proportions: { shoulderToHip: insights.shoulderToHip, waistToHip: insights.waistToHip, legToHeight: insights.legToHeight, notes: insights.notes },
    disclosure: "This is a minimized FitTwin summary. It excludes profile identifiers and raw body measurements."
  };
}

export interface McpOptions { allowWrites?: boolean; saveVault?: (vault: AgentVault) => Promise<void>; }

export function createFitTwinMcp(vault: AgentVault, options: McpOptions = {}) {
  let activeVault = vault;
  const server = new McpServer({ name: "fittwin", version: "0.1.0-alpha.2" });
  server.registerTool("fittwin_get_profile_summary", {
    title: "FitTwin profile summary",
    description: "Return the user's consented style preferences and proportional summary. Never returns profile identifiers or raw measurements.",
    inputSchema: {}
  }, async () => result(profileSummary(activeVault)));
  server.registerTool("fittwin_recommend_outfit", {
    title: "FitTwin daily outfit",
    description: "Recommend a deterministic outfit only from the user's exported wardrobe. This tool does not browse or buy items.",
    inputSchema: { occasion: z.enum(["daily", "work", "date", "travel", "event"]).optional(), temperatureC: z.number().min(-30).max(50).optional() }
  }, async ({ occasion, temperatureC }) => result(recommendOutfit(activeVault.profile, activeVault.wardrobe, { occasion: occasion ?? activeVault.profile.preferences.occasions[0], temperatureC: temperatureC ?? 20 })));
  server.registerTool("fittwin_assess_garment_fit", {
    title: "FitTwin garment fit assessment",
    description: "Compare a caller-supplied top or bottom size chart to the user's local profile. Returns a recommendation, confidence, and local measurement differences; it never guarantees fit.",
    inputSchema: { garment: garmentSpecSchema }
  }, async ({ garment }) => result(assessGarmentFit(activeVault.profile, garment)));
  server.registerTool("fittwin_generate_style_brief", {
    title: "FitTwin personal style brief",
    description: "Generate an offline, structured personal style brief from the user's exported proportions, preferences, and recorded feedback. No model provider or network request is used. The result is an option, not a body judgment or fit guarantee.",
    inputSchema: {}
  }, async () => result(await new DeterministicStyleAdvisor().generate(activeVault.profile)));
  const saveVault = options.saveVault;
  if (options.allowWrites && saveVault) server.registerTool("fittwin_record_style_feedback", {
    title: "FitTwin record style feedback",
    description: "Write one like/dislike style feedback item to the encrypted local Vault. This tool is available only when the user explicitly enables FITTWIN_ALLOW_WRITES=true. The user must import the Vault into the PWA to bring this feedback back to browser storage.",
    inputSchema: { trait: z.string().trim().min(1).max(48), sentiment: z.enum(["like", "dislike"]) }
  }, async ({ trait, sentiment }) => {
    const updated = agentVaultSchema.parse({ ...activeVault, profile: { ...activeVault.profile, updatedAt: new Date().toISOString(), feedback: [...activeVault.profile.feedback, { trait, sentiment, createdAt: new Date().toISOString() }] } });
    await saveVault(updated);
    activeVault = updated;
    return result({ recorded: true, trait, sentiment, disclosure: "Saved only to the encrypted local Agent Vault. Import that Vault in the FitTwin PWA to apply it to browser storage." });
  });
  return server;
}

export async function loadAgentVault(path: string, password: string): Promise<AgentVault> {
  const encrypted = encryptedVaultSchema.parse(JSON.parse(await readFile(path, "utf8")));
  try {
    const salt = Buffer.from(encrypted.salt, "base64");
    const iv = Buffer.from(encrypted.iv, "base64");
    const ciphertext = Buffer.from(encrypted.ciphertext, "base64");
    const key = pbkdf2Sync(password, salt, 210000, 32, "sha256");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(ciphertext.subarray(-16));
    const plain = Buffer.concat([decipher.update(ciphertext.subarray(0, -16)), decipher.final()]);
    return agentVaultSchema.parse(JSON.parse(plain.toString("utf8")));
  } catch {
    throw new Error("The Agent Vault password is incorrect or the file is damaged.");
  }
}

export async function saveAgentVault(path: string, password: string, vault: AgentVault) {
  const salt = randomBytes(16); const iv = randomBytes(12); const key = pbkdf2Sync(password, salt, 210000, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv); const ciphertext = Buffer.concat([cipher.update(JSON.stringify(agentVaultSchema.parse(vault)), "utf8"), cipher.final(), cipher.getAuthTag()]);
  const temporaryPath = `${path}.${randomBytes(8).toString("hex")}.tmp`;
  await writeFile(temporaryPath, JSON.stringify({ version: 1, salt: salt.toString("base64"), iv: iv.toString("base64"), ciphertext: ciphertext.toString("base64") }), { mode: 0o600 });
  await rename(temporaryPath, path);
}

function result(value: unknown) { return { content: [{ type: "text" as const, text: JSON.stringify(value) }], structuredContent: value as Record<string, unknown> }; }

async function main() {
  const path = process.env.FITTWIN_VAULT_PATH;
  const password = process.env.FITTWIN_VAULT_PASSWORD;
  if (!path || !password) throw new Error("Set FITTWIN_VAULT_PATH and FITTWIN_VAULT_PASSWORD before starting FitTwin MCP.");
  const allowWrites = process.env.FITTWIN_ALLOW_WRITES === "true";
  const server = createFitTwinMcp(await loadAgentVault(path, password), allowWrites ? { allowWrites, saveVault: (vault) => saveAgentVault(path, password, vault) } : {});
  await server.connect(new StdioServerTransport());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { console.error(error instanceof Error ? error.message : "Unable to start FitTwin MCP."); process.exitCode = 1; });
