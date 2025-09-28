import { auth } from "@/lib/firebase";

export type UserProfile = {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  updatedAt: number;
};

export type Institute = {
  name: string;
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
  // default from auth if available
  const u = auth.currentUser;
  return {
    name: u?.displayName || "",
    email: u?.email || "",
    phone: "",
    role: "",
    updatedAt: Date.now(),
  };
}

export function saveProfile(profile: UserProfile) {
  const id = getUserId();
  localStorage.setItem(PROFILE_KEY_PREFIX + id, JSON.stringify(profile));
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
