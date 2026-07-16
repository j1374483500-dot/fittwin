import type { ProfileStore } from "@fittwin/sdk";
import { twinProfileSchema, wardrobeItemSchema, type TwinProfile, type WardrobeItem } from "@fittwin/core";

const DB_NAME = "fittwin";
const STORE = "profiles";
const WARDROBE_STORE = "wardrobe";
const openDb = () => new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open(DB_NAME, 2); request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" }); if (!request.result.objectStoreNames.contains(WARDROBE_STORE)) request.result.createObjectStore(WARDROBE_STORE, { keyPath: "id" }); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });

export class IndexedDbProfileStore implements ProfileStore {
  async get(id: string) { const db = await openDb(); return await new Promise<TwinProfile | undefined>((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).get(id); request.onsuccess = () => resolve(request.result ? twinProfileSchema.parse(request.result) : undefined); request.onerror = () => reject(request.error); }); }
  async set(profile: TwinProfile) { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(profile); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
  async remove(id: string) { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
  async clear() { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).clear(); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
}

export class IndexedDbWardrobeStore {
  async list() { const db = await openDb(); return await new Promise<WardrobeItem[]>((resolve, reject) => { const request = db.transaction(WARDROBE_STORE).objectStore(WARDROBE_STORE).getAll(); request.onsuccess = () => resolve((request.result as unknown[]).map((item) => wardrobeItemSchema.parse(item))); request.onerror = () => reject(request.error); }); }
  async set(item: WardrobeItem) { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(WARDROBE_STORE, "readwrite").objectStore(WARDROBE_STORE).put(item); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
  async remove(id: string) { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(WARDROBE_STORE, "readwrite").objectStore(WARDROBE_STORE).delete(id); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
  async clear() { const db = await openDb(); await new Promise<void>((resolve, reject) => { const request = db.transaction(WARDROBE_STORE, "readwrite").objectStore(WARDROBE_STORE).clear(); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); }); }
}
