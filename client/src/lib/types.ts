import type { Timestamp } from "firebase/firestore";

export type Role = "admin" | "viewer";

export interface AppSettings {
  appName: string;
  brandColor: string;
  logoUrl: string;
}

export interface UserDoc {
  uid: string;
  role: Role;
  displayName: string;
  email?: string;
}

export interface Category {
  id: string;
  name: string;
  iconUrl: string;
  color: string;
  order: number;
  createdAt?: Timestamp | null;
}

export interface FileItem {
  id: string;
  categoryId: string;
  name: string;
  year: number;
  month: number; // 1-12
  serverPath: string;
  size: number;
  hasMacro: boolean;
  version: number;
  isLatest?: boolean;
  deleted?: boolean;
  deletedAt?: Timestamp | null;
  supersedes?: string | null;
  uploadedAt?: Timestamp | null;
  uploadedBy?: string | null;
}
