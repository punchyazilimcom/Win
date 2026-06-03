import { auth } from "../firebase";

const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

function url(path: string): string {
  return `${API_BASE}${path}`;
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Oturum bulunamadı.");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || `İstek başarısız (${res.status})`;
  } catch {
    return `İstek başarısız (${res.status})`;
  }
}

export interface UploadResult {
  id: string;
  name: string;
  categoryId: string;
  year: number;
  month: number;
  size: number;
  hasMacro: boolean;
  version: number;
  serverPath: string;
}

export async function uploadFile(params: {
  file: File;
  categoryId: string;
  year?: number;
  month?: number;
  onProgress?: (pct: number) => void;
}): Promise<UploadResult> {
  const headers = await authHeader();
  const form = new FormData();
  form.append("file", params.file);
  form.append("categoryId", params.categoryId);
  if (params.year != null) form.append("year", String(params.year));
  if (params.month != null) form.append("month", String(params.month));

  // Use XHR to support upload progress reporting.
  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url("/api/upload"));
    xhr.setRequestHeader("Authorization", headers.Authorization);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && params.onProgress) {
        params.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Geçersiz sunucu yanıtı."));
        }
      } else {
        let msg = `Yükleme başarısız (${xhr.status})`;
        try {
          msg = JSON.parse(xhr.responseText)?.error || msg;
        } catch {
          /* ignore */
        }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("Ağ hatası: sunucuya ulaşılamadı."));
    xhr.send(form);
  });
}

export interface OpenResult {
  url: string;
}

/** Requests a Guacamole session URL for a file. Throws on session-limit (429). */
export async function openFile(fileId: string): Promise<OpenResult> {
  const headers = await authHeader();
  const res = await fetch(url("/api/open"), {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  });
  if (!res.ok) {
    const err = new Error(await parseError(res)) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export interface SessionsInfo {
  active: number;
  max: number;
  sessions: { fileId: string; fileName: string; openedAt: number }[];
}

export async function getSessions(): Promise<SessionsInfo> {
  const headers = await authHeader();
  const res = await fetch(url("/api/sessions"), { headers });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function closeSession(fileId: string): Promise<void> {
  const headers = await authHeader();
  await fetch(url("/api/sessions/close"), {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ fileId }),
  }).catch(() => {
    /* best-effort */
  });
}
