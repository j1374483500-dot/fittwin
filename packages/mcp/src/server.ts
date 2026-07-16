#!/usr/bin/env node
import { createDecipheriv, pbkdf2Sync } from "node:crypto";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { agentVaultSchema, assessGarmentFit, calculateInsights, garmentSpecSchema, recommendOutfit, type AgentVault } from "@fittwin/core";
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

export function createFitTwinMcp(vault: AgentVault) {
  const server = new McpServer({ name: "fittwin", version: "0.1.0-alpha.1" });
  server.registerTool("fittwin_get_profile_summary", {
    title: "FitTwin profile summary",
    description: "Return the user's consented style preferences and proportional summary. Never returns profile identifiers or raw measurements.",
    inputSchema: {}
  }, async () => result(profileSummary(vault)));
  server.registerTool("fittwin_recommend_outfit", {
    title: "FitTwin daily outfit",
    description: "Recommend a deterministic outfit only from the user's exported wardrobe. This tool does not browse or buy items.",
    inputSchema: { occasion: z.enum(["daily", "work", "date", "travel", "event"]).optional(), temperatureC: z.number().min(-30).max(50).optional() }
  }, async ({ occasion, temperatureC }) => result(recommendOutfit(vault.profile, vault.wardrobe, { occasion: occasion ?? vault.profile.preferences.occasions[0], temperatureC: temperatureC ?? 20 })));
  server.registerTool("fittwin_assess_garment_fit", {
    title: "FitTwin garment fit assessment",
    description: "Compare a caller-supplied top or bottom size chart to the user's local profile. Returns a recommendation, confidence, and local measurement differences; it never guarantees fit.",
    inputSchema: { garment: garmentSpecSchema }
  }, async ({ garment }) => result(assessGarmentFit(vault.profile, garment)));
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

function result(value: unknown) { return { content: [{ type: "text" as const, text: JSON.stringify(value) }], structuredContent: value as Record<string, unknown> }; }

async function main() {
  const path = process.env.FITTWIN_VAULT_PATH;
  const password = process.env.FITTWIN_VAULT_PASSWORD;
  if (!path || !password) throw new Error("Set FITTWIN_VAULT_PATH and FITTWIN_VAULT_PASSWORD before starting FitTwin MCP.");
  const server = createFitTwinMcp(await loadAgentVault(path, password));
  await server.connect(new StdioServerTransport());
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { console.error(error instanceof Error ? error.message : "Unable to start FitTwin MCP."); process.exitCode = 1; });
