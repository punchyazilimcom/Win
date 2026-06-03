import { Router, Response } from "express";
import { db } from "../lib/firebaseAdmin";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import { buildGuacToken, buildGuacUrl } from "../lib/guacToken";
import { fileExists } from "../lib/fileStore";
import { hasCapacity, openSession, getMaxSessions } from "../lib/sessionStore";

const router = Router();

/**
 * POST /api/open
 * body: { fileId }
 * Returns { url } where url is the Guacamole iframe URL carrying a fresh
 * 60-second Encrypted JSON token that launches the real desktop Excel via
 * RemoteApp on the Windows host.
 */
router.post("/open", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const fileId = String(req.body?.fileId || "").trim();
    if (!fileId) {
      res.status(400).json({ error: "fileId zorunludur." });
      return;
    }

    const snap = await db().collection("files").doc(fileId).get();
    if (!snap.exists) {
      res.status(404).json({ error: "Dosya bulunamadı." });
      return;
    }
    const data = snap.data() || {};
    if (data.deleted) {
      res.status(410).json({ error: "Bu dosya silinmiş." });
      return;
    }

    const serverPath = String(data.serverPath || "");
    const fileName = String(data.name || "Excel");
    if (!serverPath) {
      res.status(500).json({ error: "Dosya yolu kaydı eksik." });
      return;
    }
    // The file lives on the Windows host; on a real deployment the server may
    // share the same mount. We only warn (not block) if it is not visible here.
    if (!fileExists(serverPath)) {
      // Not fatal: the path is interpreted by the Windows RemoteApp host.
      console.warn(`open: serverPath not visible from server fs: ${serverPath}`);
    }

    // Enforce the concurrent-session cap.
    if (!hasCapacity(fileId)) {
      res.status(429).json({
        error: `En fazla ${getMaxSessions()} dosya aynı anda açık olabilir.`,
        max: getMaxSessions(),
      });
      return;
    }

    const username = req.user?.email || req.user?.uid || "user";
    const token = buildGuacToken({ fileName, serverPath, username });
    const url = buildGuacUrl(token);

    // Register the session (refreshes if already open).
    openSession(fileId, req.user?.uid || "unknown", fileName);

    // Record "recently opened" for the user (best-effort).
    try {
      await db()
        .collection("users")
        .doc(req.user!.uid)
        .collection("recent")
        .doc(fileId)
        .set({
          fileId,
          name: fileName,
          openedAt: new Date(),
        });
    } catch {
      /* non-fatal */
    }

    res.json({ url });
  } catch (err) {
    console.error("open error", err);
    res.status(500).json({ error: "Oturum başlatılamadı." });
  }
});

export default router;
