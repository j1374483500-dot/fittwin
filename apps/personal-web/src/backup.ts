import { agentVaultSchema, twinProfileSchema, type AgentVault, type TwinProfile } from "@fittwin/core";

export interface EncryptedBackup { version: 1; salt: string; iv: string; ciphertext: string; }
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export async function encryptProfile(profile: TwinProfile, password: string): Promise<EncryptedBackup> {
  return encryptData(profile, password);
}

export async function encryptAgentVault(vault: AgentVault, password: string): Promise<EncryptedBackup> {
  return encryptData(agentVaultSchema.parse(vault), password);
}

export async function encryptData(data: unknown, password: string): Promise<EncryptedBackup> {
  if (password.length < 10) throw new Error("Use a backup password with at least 10 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as BufferSource }, key, encoder.encode(JSON.stringify(data)));
  return { version: 1, salt: toBase64(salt), iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(encrypted)) };
}

export async function decryptProfile(backup: EncryptedBackup, password: string): Promise<TwinProfile> {
  return twinProfileSchema.parse(await decryptData(backup, password));
}

export async function decryptAgentVault(backup: EncryptedBackup, password: string): Promise<AgentVault> {
  return agentVaultSchema.parse(await decryptData(backup, password));
}

export async function decryptData(backup: EncryptedBackup, password: string): Promise<unknown> {
  if (backup.version !== 1) throw new Error("This backup version is not supported.");
  const key = await deriveKey(password, fromBase64(backup.salt));
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(backup.iv) as unknown as BufferSource }, key, fromBase64(backup.ciphertext));
    return JSON.parse(decoder.decode(plain));
  } catch { throw new Error("The backup password is incorrect or the file is damaged."); }
}

async function deriveKey(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations: 210000 }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
function toBase64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
function fromBase64(value: string) { return Uint8Array.from(atob(value), (char) => char.charCodeAt(0)); }
