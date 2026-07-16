import { createCipheriv, pbkdf2Sync, randomBytes } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { createProfile, type AgentVault } from "@fittwin/core";
import { describe, expect, it } from "vitest";
import { loadAgentVault, profileSummary } from "../src/server.js";

const profile = createProfile({ id: "private-profile-id", measurements: { height: { value: 170 }, shoulder: { value: 42 }, chest: { value: 90 }, waist: { value: 72 }, hip: { value: 96 }, inseam: { value: 78 } }, preferences: { goals: ["classic"], occasions: ["daily"], avoid: [] } });
const vault: AgentVault = { schemaVersion: "1.0", exportedAt: new Date().toISOString(), profile, wardrobe: [{ id: "shirt", name: "White shirt", category: "top", color: "white", formality: 3, warmth: 2, styleTags: ["classic"], createdAt: new Date().toISOString() }, { id: "trouser", name: "Black trouser", category: "bottom", color: "black", formality: 3, warmth: 3, styleTags: ["classic"], createdAt: new Date().toISOString() }], garments: [] };
const password = "long-enough-password";

describe("FitTwin MCP", () => {
  it("minimizes the profile summary", () => {
    const summary = profileSummary(vault);
    expect(JSON.stringify(summary)).not.toContain("private-profile-id");
    expect(JSON.stringify(summary)).not.toContain("170");
    expect(summary.proportions).toHaveProperty("shoulderToHip");
  });

  it("loads an encrypted vault and serves three tools over stdio", async () => {
    const vaultPath = await writeVault(vault, password);
    await expect(loadAgentVault(vaultPath, "wrong-password")).rejects.toThrow("incorrect");
    const client = new Client({ name: "fittwin-test-client", version: "1.0" });
    const transport = new StdioClientTransport({ command: process.execPath, args: [resolve(process.cwd(), "dist/server.js")], cwd: process.cwd(), env: { PATH: process.env.PATH ?? "", FITTWIN_VAULT_PATH: vaultPath, FITTWIN_VAULT_PASSWORD: password }, stderr: "pipe" });
    await client.connect(transport);
    const tools = await client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining(["fittwin_get_profile_summary", "fittwin_recommend_outfit", "fittwin_assess_garment_fit"]));
    expect(tools.tools.map((tool) => tool.name)).not.toContain("fittwin_record_style_feedback");
    const summary = await client.callTool({ name: "fittwin_get_profile_summary", arguments: {} });
    expect(JSON.stringify(summary)).not.toContain("private-profile-id");
    const outfit = await client.callTool({ name: "fittwin_recommend_outfit", arguments: { temperatureC: 20 } });
    expect(JSON.stringify(outfit)).toContain("White shirt");
    const fit = await client.callTool({ name: "fittwin_assess_garment_fit", arguments: { garment: { id: "tee", name: "Tee", category: "top", fitIntent: "regular", sizes: [{ label: "M", measurements: { shoulder: 44, chest: 106 } }] } } });
    expect(JSON.stringify(fit)).toContain("recommendedSize");
    await client.close();

    const writableClient = new Client({ name: "fittwin-write-test-client", version: "1.0" });
    const writableTransport = new StdioClientTransport({ command: process.execPath, args: [resolve(process.cwd(), "dist/server.js")], cwd: process.cwd(), env: { PATH: process.env.PATH ?? "", FITTWIN_VAULT_PATH: vaultPath, FITTWIN_VAULT_PASSWORD: password, FITTWIN_ALLOW_WRITES: "true" }, stderr: "pipe" });
    await writableClient.connect(writableTransport);
    const record = await writableClient.callTool({ name: "fittwin_record_style_feedback", arguments: { trait: "short jacket", sentiment: "like" } });
    expect(JSON.stringify(record)).toContain("recorded");
    await writableClient.close();
    await expect(loadAgentVault(vaultPath, password)).resolves.toMatchObject({ profile: { feedback: expect.arrayContaining([expect.objectContaining({ trait: "short jacket", sentiment: "like" })]) } });
  });
});

async function writeVault(value: AgentVault, vaultPassword: string) {
  const salt = randomBytes(16); const iv = randomBytes(12); const key = pbkdf2Sync(vaultPassword, salt, 210000, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv); const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final(), cipher.getAuthTag()]);
  const directory = await mkdtemp(resolve(tmpdir(), "fittwin-mcp-")); const path = resolve(directory, "vault.json");
  await writeFile(path, JSON.stringify({ version: 1, salt: salt.toString("base64"), iv: iv.toString("base64"), ciphertext: ciphertext.toString("base64") }));
  return path;
}
