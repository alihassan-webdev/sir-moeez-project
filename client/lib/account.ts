import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  updatedAt: number;
  notify?: boolean;
};

export type Institute = {
  name: string;
  logo?: string;
  type?: string;
  address?: string;
  city?: string;
  contactEmail?: string;
  contactPhone?: string;
  teachersCount?: number;
  website?: string;
  registeredAt: number;
};

const PROFILE_KEY_PREFIX = "papergen:profile:";
const INSTITUTE_KEY_PREFIX = "papergen:institute:";

function getUserId() {
  const u = auth.currentUser;
  return u?.uid || u?.email || "anonymous";
}

export function getProfile(): UserProfile {
  const id = getUserId();
  const raw = localStorage.getItem(PROFILE_KEY_PREFIX + id);
  if (raw) {
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {}
  }
  const u = auth.currentUser;
  return {
    name: u?.displayName || "",
    email: u?.email || "",
    phone: "",
    updatedAt: Date.now(),
    notify: false,
  };
}

export function saveProfile(profile: UserProfile) {
  const id = getUserId();
  localStorage.setItem(PROFILE_KEY_PREFIX + id, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile> {
  const id = getUserId();
  if (!id || id === "anonymous") return getProfile();
  try {
    const snap = await getDoc(doc(db, "profiles", id));
    if (snap.exists()) {
      const remote = snap.data() as Partial<UserProfile>;
      const current = getProfile();
      const merged: UserProfile = {
        name: String(remote.name ?? current.name ?? ""),
        email: String(remote.email ?? current.email ?? ""),
        phone: String(remote.phone ?? current.phone ?? ""),
        updatedAt: Number(remote.updatedAt ?? current.updatedAt ?? Date.now()),
        notify: Boolean(remote.notify ?? current.notify ?? false),
      };
      saveProfile(merged);
      return merged;
    }
  } catch {}
  return getProfile();
}

export async function persistProfile(profile: UserProfile): Promise<void> {
  saveProfile(profile);
  const id = getUserId();
  if (!id || id === "anonymous") return;
  try {
    await setDoc(doc(db, "profiles", id), profile, { merge: true });
  } catch {}
}

export function getInstitute(): Institute | null {
  const id = getUserId();
  const raw = localStorage.getItem(INSTITUTE_KEY_PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Institute;
  } catch {
    return null;
  }
}

export function saveInstitute(inst: Institute) {
  const id = getUserId();
  localStorage.setItem(INSTITUTE_KEY_PREFIX + id, JSON.stringify(inst));
}
