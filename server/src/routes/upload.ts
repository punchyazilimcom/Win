import { Router, Response } from "express";
import multer from "multer";
import { admin, db } from "../lib/firebaseAdmin";
import { AuthedRequest, requireAuth, requireAdmin } from "../middleware/auth";
import {
  ensureDestDir,
  guessYearMonth,
  hasMacroExt,
  isAllowedFile,
  maxUploadBytes,
  sanitizeSegment,
  writeVersionedFile,
} from "../lib/fileStore";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes() },
});

/**
 * POST /api/upload
 * multipart/form-data:
 *   - file: the Excel file (.xlsx/.xlsm/.csv)
 *   - categoryId: string (required)
 *   - year: number (optional, guessed from name if missing)
 *   - month: number 1-12 (optional, guessed from name if missing)
 */
router.post(
  "/upload",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  async (req: AuthedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "Dosya bulunamadı." });
        return;
      }
      if (!isAllowedFile(file.originalname)) {
        res
          .status(400)
          .json({ error: "Yalnızca .xlsx, .xlsm ve .csv dosyaları yüklenebilir." });
        return;
      }
      if (file.size > maxUploadBytes()) {
        res.status(400).json({ error: "Dosya boyutu sınırı aşıldı." });
        return;
      }

      const categoryId = String(req.body.categoryId || "").trim();
      if (!categoryId) {
        res.status(400).json({ error: "categoryId zorunludur." });
        return;
      }

      const catSnap = await db().collection("categories").doc(categoryId).get();
      if (!catSnap.exists) {
        res.status(404).json({ error: "Kategori bulunamadı." });
        return;
      }
      const categoryName = (catSnap.data()?.name as string) || categoryId;

      // Resolve year/month: explicit body values win, else guess from name.
      const guess = guessYearMonth(file.originalname);
      let year = Number(req.body.year) || guess.year || new Date().getFullYear();
      let month =
        Number(req.body.month) || guess.month || new Date().getMonth() + 1;
      if (month < 1 || month > 12) month = new Date().getMonth() + 1;

      const safeName = sanitizeSegment(file.originalname);

      // Determine previous version for this (category, name).
      const prevQuery = await db()
        .collection("files")
        .where("categoryId", "==", categoryId)
        .where("name", "==", safeName)
        .orderBy("version", "desc")
        .limit(1)
        .get();

      let previousVersion = 0;
      let previousDocId: string | null = null;
      if (!prevQuery.empty) {
        const d = prevQuery.docs[0];
        previousVersion = Number(d.data().version) || 0;
        previousDocId = d.id;
      }

      const destDir = ensureDestDir(categoryName, year, month);
      const { absPath, version } = writeVersionedFile(
        destDir,
        safeName,
        file.buffer,
        previousVersion
      );

      const hasMacro = hasMacroExt(safeName);
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Mark the previous record as superseded (kept for version history).
      if (previousDocId) {
        await db()
          .collection("files")
          .doc(previousDocId)
          .set({ isLatest: false }, { merge: true });
      }

      const docRef = await db().collection("files").add({
        categoryId,
        name: safeName,
        year,
        month,
        serverPath: absPath,
        size: file.size,
        hasMacro,
        version,
        isLatest: true,
        deleted: false,
        uploadedAt: now,
        uploadedBy: req.user?.uid || null,
        supersedes: previousDocId,
      });

      res.json({
        id: docRef.id,
        name: safeName,
        categoryId,
        year,
        month,
        size: file.size,
        hasMacro,
        version,
        serverPath: absPath,
      });
    } catch (err: any) {
      if (err && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "Dosya boyutu sınırı aşıldı." });
        return;
      }
      console.error("upload error", err);
      res.status(500).json({ error: "Yükleme sırasında bir hata oluştu." });
    }
  }
);

export default router;
