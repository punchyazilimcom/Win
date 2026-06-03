import { Request, Response, NextFunction } from "express";
import { authAdmin, db } from "../lib/firebaseAdmin";

export interface AuthedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: "admin" | "viewer";
    displayName?: string;
  };
}

/**
 * Verifies the Firebase ID token from the `Authorization: Bearer <token>`
 * header and attaches the resolved user (including Firestore role) to req.user.
 */
export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      res.status(401).json({ error: "Yetkilendirme başlığı eksik." });
      return;
    }
    const idToken = match[1].trim();
    const decoded = await authAdmin().verifyIdToken(idToken);

    // Resolve role from Firestore users/{uid}. Default to viewer.
    let role: "admin" | "viewer" = "viewer";
    let displayName: string | undefined;
    try {
      const snap = await db().collection("users").doc(decoded.uid).get();
      if (snap.exists) {
        const data = snap.data() || {};
        if (data.role === "admin") role = "admin";
        displayName = data.displayName;
      }
    } catch {
      // If Firestore is unreachable we still allow viewer-level access.
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role,
      displayName,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: "Geçersiz veya süresi dolmuş oturum." });
  }
}

/** Requires that the authenticated user has the admin role. */
export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: "Oturum gerekli." });
    return;
  }
  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Bu işlem için yönetici yetkisi gerekli." });
    return;
  }
  next();
}
