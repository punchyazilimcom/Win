import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { dbc, storage } from "../firebase";
import type { AppSettings, Category, FileItem, UserDoc, Role } from "./types";

/* ----------------------------- settings ----------------------------- */

const DEFAULT_SETTINGS: AppSettings = {
  appName: "Excel Yöneticisi",
  brandColor: "#F4DF16",
  logoUrl: "",
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const snap = await getDoc(doc(dbc, "settings", "app"));
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<AppSettings>) };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  await setDoc(doc(dbc, "settings", "app"), patch, { merge: true });
}

/* ------------------------------- users ------------------------------ */

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(dbc, "users", uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid,
    role: (d.role as Role) || "viewer",
    displayName: d.displayName || "",
    email: d.email,
  };
}

export async function ensureUserDoc(
  uid: string,
  email: string | null,
  displayName: string
): Promise<UserDoc> {
  const existing = await getUserDoc(uid);
  if (existing) return existing;
  // New users self-register as "viewer". The first administrator is promoted
  // manually from the Firebase console (set role:"admin"); thereafter admins
  // manage roles from the Settings panel. This keeps the security rules simple
  // and prevents self-promotion to admin.
  const data: Omit<UserDoc, "uid"> = {
    role: "viewer",
    displayName: displayName || email || "Kullanıcı",
    email: email || undefined,
  };
  try {
    await setDoc(doc(dbc, "users", uid), data, { merge: true });
  } catch {
    // If rules reject the write we still operate with a local viewer profile.
  }
  return { uid, ...data };
}

export async function listUsers(): Promise<UserDoc[]> {
  const snap = await getDocs(collection(dbc, "users"));
  return snap.docs.map((d) => ({
    uid: d.id,
    role: (d.data().role as Role) || "viewer",
    displayName: d.data().displayName || "",
    email: d.data().email,
  }));
}

export async function setUserRole(uid: string, role: Role): Promise<void> {
  await updateDoc(doc(dbc, "users", uid), { role });
}

/* ----------------------------- categories --------------------------- */

export async function listCategories(): Promise<Category[]> {
  const q = query(collection(dbc, "categories"), orderBy("order", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) }));
}

export async function createCategory(
  data: Omit<Category, "id" | "createdAt">
): Promise<string> {
  const ref2 = await addDoc(collection(dbc, "categories"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref2.id;
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<Category, "id">>
): Promise<void> {
  await updateDoc(doc(dbc, "categories", id), patch);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(dbc, "categories", id));
}

export async function reorderCategories(ordered: Category[]): Promise<void> {
  const batch = writeBatch(dbc);
  ordered.forEach((c, i) => {
    batch.update(doc(dbc, "categories", c.id), { order: i });
  });
  await batch.commit();
}

export async function uploadCategoryIcon(file: File): Promise<string> {
  const path = `category-icons/${Date.now()}_${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

export async function uploadLogo(file: File): Promise<string> {
  const path = `branding/logo_${Date.now()}_${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

/* ------------------------------- files ------------------------------ */

function mapFile(id: string, d: any): FileItem {
  return {
    id,
    categoryId: d.categoryId,
    name: d.name,
    year: Number(d.year) || 0,
    month: Number(d.month) || 0,
    serverPath: d.serverPath || "",
    size: Number(d.size) || 0,
    hasMacro: !!d.hasMacro,
    version: Number(d.version) || 1,
    isLatest: d.isLatest !== false,
    deleted: !!d.deleted,
    deletedAt: d.deletedAt ?? null,
    supersedes: d.supersedes ?? null,
    uploadedAt: d.uploadedAt ?? null,
    uploadedBy: d.uploadedBy ?? null,
  };
}

/** Latest, non-deleted files in a category (optionally filtered by year/month). */
export async function listFiles(
  categoryId: string,
  year?: number,
  month?: number
): Promise<FileItem[]> {
  const q = query(collection(dbc, "files"), where("categoryId", "==", categoryId));
  const snap = await getDocs(q);
  let items = snap.docs
    .map((d) => mapFile(d.id, d.data()))
    .filter((f) => !f.deleted && f.isLatest !== false);
  if (year != null) items = items.filter((f) => f.year === year);
  if (month != null) items = items.filter((f) => f.month === month);
  // newest first
  items.sort((a, b) => b.version - a.version || a.name.localeCompare(b.name));
  return items;
}

/** All latest, non-deleted files (used for global search & counts). */
export async function listAllFiles(): Promise<FileItem[]> {
  const snap = await getDocs(collection(dbc, "files"));
  return snap.docs
    .map((d) => mapFile(d.id, d.data()))
    .filter((f) => !f.deleted && f.isLatest !== false);
}

/** Version history for a given (category, name): all versions, newest first. */
export async function listVersions(
  categoryId: string,
  name: string
): Promise<FileItem[]> {
  const q = query(
    collection(dbc, "files"),
    where("categoryId", "==", categoryId),
    where("name", "==", name)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapFile(d.id, d.data()))
    .filter((f) => !f.deleted)
    .sort((a, b) => b.version - a.version);
}

/** Soft-delete (trash). */
export async function trashFile(id: string): Promise<void> {
  await updateDoc(doc(dbc, "files", id), {
    deleted: true,
    deletedAt: serverTimestamp(),
  });
}

export async function restoreFile(id: string): Promise<void> {
  await updateDoc(doc(dbc, "files", id), { deleted: false, deletedAt: null });
}

export async function listTrash(): Promise<FileItem[]> {
  const q = query(collection(dbc, "files"), where("deleted", "==", true));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapFile(d.id, d.data()))
    .sort((a, b) => {
      const ta = a.deletedAt instanceof Timestamp ? a.deletedAt.toMillis() : 0;
      const tb = b.deletedAt instanceof Timestamp ? b.deletedAt.toMillis() : 0;
      return tb - ta;
    });
}

/**
 * Makes an older version current again ("revert"): marks the target version
 * isLatest=true and demotes all sibling versions.
 */
export async function revertToVersion(target: FileItem): Promise<void> {
  const siblings = await listVersions(target.categoryId, target.name);
  const batch = writeBatch(dbc);
  for (const s of siblings) {
    batch.update(doc(dbc, "files", s.id), { isLatest: s.id === target.id });
  }
  await batch.commit();
}

/* --------------------------- recently opened ------------------------ */

export async function listRecent(uid: string, max = 8): Promise<FileItem[]> {
  try {
    const snap = await getDocs(
      query(collection(dbc, "users", uid, "recent"), orderBy("openedAt", "desc"))
    );
    const ids = snap.docs.slice(0, max).map((d) => d.id);
    const out: FileItem[] = [];
    for (const id of ids) {
      const fsnap = await getDoc(doc(dbc, "files", id));
      if (fsnap.exists()) {
        const f = mapFile(fsnap.id, fsnap.data());
        if (!f.deleted) out.push(f);
      }
    }
    return out;
  } catch {
    return [];
  }
}
