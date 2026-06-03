import { Router, Response } from "express";
import { AuthedRequest, requireAuth } from "../middleware/auth";
import {
  activeCount,
  closeSession,
  getMaxSessions,
  listSessions,
} from "../lib/sessionStore";

const router = Router();

/** GET /api/sessions -> { active, max, sessions } */
router.get("/sessions", requireAuth, (_req: AuthedRequest, res: Response) => {
  res.json({
    active: activeCount(),
    max: getMaxSessions(),
    sessions: listSessions().map((s) => ({
      fileId: s.fileId,
      fileName: s.fileName,
      openedAt: s.openedAt,
    })),
  });
});

/** POST /api/sessions/close { fileId } -> releases a session slot. */
router.post(
  "/sessions/close",
  requireAuth,
  (req: AuthedRequest, res: Response) => {
    const fileId = String(req.body?.fileId || "").trim();
    if (!fileId) {
      res.status(400).json({ error: "fileId zorunludur." });
      return;
    }
    const closed = closeSession(fileId);
    res.json({ closed, active: activeCount(), max: getMaxSessions() });
  }
);

export default router;
