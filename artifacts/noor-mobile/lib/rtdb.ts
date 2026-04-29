import { ref, get, set, update } from "firebase/database";
import { rtdb } from "./firebase";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photo: string;
  governorateId: string;
  governorateName: string;
  lat: number;
  lng: number;
  joinedAt: number;
}

let _currentUid: string | null = null;
let _profileCache: UserProfile | null = null;

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  _currentUid = uid;
  try {
    const snap = await get(ref(rtdb, `users/${uid}/profile`));
    if (snap.exists()) {
      _profileCache = snap.val() as UserProfile;
      return _profileCache;
    }
  } catch (e) {
    console.warn("loadUserProfile error", e);
  }
  return null;
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  _profileCache = profile;
  await set(ref(rtdb, `users/${uid}/profile`), profile);
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  if (_profileCache) {
    _profileCache = { ..._profileCache, ...updates };
  }
  await update(ref(rtdb, `users/${uid}/profile`), updates);
}

export function getProfileCache(): UserProfile | null {
  return _profileCache;
}

export function getCurrentUid(): string | null {
  return _currentUid;
}

export function clearProfileCache(): void {
  _profileCache = null;
  _currentUid = null;
}

export async function incrementCounter(uid: string, path: string, by: number = 1): Promise<void> {
  try {
    const r = ref(rtdb, `users/${uid}/${path}`);
    const snap = await get(r);
    const current = (snap.val() as number) || 0;
    await set(r, current + by);
  } catch (e) {
    console.warn("incrementCounter error", e);
  }
}

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
