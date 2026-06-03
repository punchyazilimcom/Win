import "dotenv/config";
import express from "express";
import cors from "cors";
import { initFirebaseAdmin } from "./lib/firebaseAdmin";
import uploadRouter from "./routes/upload";
import openRouter from "./routes/open";
import sessionsRouter from "./routes/sessions";

initFirebaseAdmin();

const app = express();

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.length === 1 && origins[0] === "*" ? true : origins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

app.use("/api", uploadRouter);
app.use("/api", openRouter);
app.use("/api", sessionsRouter);

// Generic error handler (e.g. multer errors).
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    if (err && err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Dosya boyutu sınırı aşıldı." });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası." });
  }
);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`[excel-manager] server listening on :${PORT}`);
});
