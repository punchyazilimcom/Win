import fs from "fs";
import path from "path";

const MONTHS_TR = [
  "ocak", "subat", "mart", "nisan", "mayis", "haziran",
  "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik",
];

export function shareRoot(): string {
  return process.env.FILE_SHARE_ROOT || path.resolve(process.cwd(), "uploads");
}

export function maxUploadBytes(): number {
  const n = Number(process.env.MAX_UPLOAD_BYTES || 52428800);
  return Number.isFinite(n) && n > 0 ? n : 52428800;
}

const ALLOWED_EXT = new Set([".xlsx", ".xlsm", ".csv"]);

export function isAllowedFile(name: string): boolean {
  return ALLOWED_EXT.has(path.extname(name).toLowerCase());
}

export function hasMacroExt(name: string): boolean {
  return path.extname(name).toLowerCase() === ".xlsm";
}

/** Removes characters that are unsafe for a path segment. */
export function sanitizeSegment(seg: string): string {
  return seg
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\.\.+/g, "_")
    .trim()
    .replace(/^\.+/, "")
    || "untitled";
}

/**
 * Best-effort extraction of (year, month) from a file name such as
 * "SUBAT_2026", "2026-02", "Bordro_02_2026". Returns nulls if not found.
 */
export function guessYearMonth(name: string): { year: number | null; month: number | null } {
  const base = name.toLowerCase();

  let year: number | null = null;
  const yearMatch = base.match(/(20\d{2})/);
  if (yearMatch) year = Number(yearMatch[1]);

  let month: number | null = null;
  // Turkish month name
  for (let i = 0; i < MONTHS_TR.length; i++) {
    if (base.includes(MONTHS_TR[i])) {
      month = i + 1;
      break;
    }
  }
  // Numeric month like _02_ or -2-
  if (month === null) {
    const mm = base.match(/[._\-\s](0?[1-9]|1[0-2])[._\-\s]/);
    if (mm) month = Number(mm[1]);
  }

  return { year, month };
}

/**
 * Builds the destination directory for a file:
 *   {SHARE}/{category}/{year}/{month padded}/
 * and ensures it exists. Returns the absolute directory path.
 */
export function ensureDestDir(categoryName: string, year: number, month: number): string {
  const dir = path.join(
    shareRoot(),
    sanitizeSegment(categoryName),
    String(year),
    String(month).padStart(2, "0")
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Writes the uploaded buffer to disk, handling versioning. If a file with the
 * same name already exists, the previous file is moved to a ".vN" archive name
 * and the new one takes the canonical name. Returns the final absolute path and
 * the computed version number (1 for first upload).
 */
export function writeVersionedFile(
  destDir: string,
  fileName: string,
  buffer: Buffer,
  previousVersion: number
): { absPath: string; version: number } {
  const safeName = sanitizeSegment(fileName);
  const target = path.join(destDir, safeName);
  const version = previousVersion > 0 ? previousVersion + 1 : 1;

  if (fs.existsSync(target) && version > 1) {
    // Archive the existing file under its previous version.
    const ext = path.extname(safeName);
    const stem = safeName.slice(0, safeName.length - ext.length);
    const archive = path.join(destDir, `${stem}.v${previousVersion}${ext}`);
    try {
      fs.renameSync(target, archive);
    } catch {
      // If archiving fails we still overwrite to keep the latest authoritative.
    }
  }

  fs.writeFileSync(target, buffer);
  return { absPath: target, version };
}

export function fileExists(absPath: string): boolean {
  try {
    return fs.existsSync(absPath) && fs.statSync(absPath).isFile();
  } catch {
    return false;
  }
}
