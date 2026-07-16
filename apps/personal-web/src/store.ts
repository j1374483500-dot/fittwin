import type { ProfileStore } from "@fittwin/sdk";
import { twinProfileSchema, type TwinProfile } from "@fittwin/core";

const DB_NAME = "fittwin";
const STORE = "profiles";
const openDb = () => new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });

export class IndexedDbProfileStore implements ProfileStore {
  async get(id: string) { const db = await openDb(); return await new Promise<TwinProfile | undefined>((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).get(id); request.onsuccess = () => resolve(request.result ? twinProfileSchema.parse(request.result) : undefined); request.onerror = () => reject(request.error); }); }
  async set(profile: TwinProfile) { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(profile); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
  async remove(id: string) { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
  async clear() { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).clear(); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
}
