import { useMemo, useRef, useState } from "react";
import Dialog from "./Dialog";
import { MONTHS_TR } from "../theme";
import { uploadFile } from "../lib/api";
import { useToast } from "./Toast";
import { IconUpload } from "./icons";

interface Props {
  categoryId: string;
  defaultYear: number;
  defaultMonth: number;
  onClose: () => void;
  onUploaded: () => void;
}

const MONTHS_KEY = [
  "ocak", "subat", "mart", "nisan", "mayis", "haziran",
  "temmuz", "agustos", "eylul", "ekim", "kasim", "aralik",
];

/** Mirrors the server-side guesser so the form pre-fills sensibly. */
function guess(name: string): { year?: number; month?: number } {
  const base = name
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
  const out: { year?: number; month?: number } = {};
  const y = base.match(/(20\d{2})/);
  if (y) out.year = Number(y[1]);
  for (let i = 0; i < MONTHS_KEY.length; i++) {
    if (base.includes(MONTHS_KEY[i])) {
      out.month = i + 1;
      break;
    }
  }
  if (out.month == null) {
    const mm = base.match(/[._\-\s](0?[1-9]|1[0-2])[._\-\s]/);
    if (mm) out.month = Number(mm[1]);
  }
  return out;
}

const ALLOWED = [".xlsx", ".xlsm", ".csv"];
function allowed(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED.some((e) => lower.endsWith(e));
}

export default function UploadModal({
  categoryId,
  defaultYear,
  defaultMonth,
  onClose,
  onUploaded,
}: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(defaultMonth);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const set = new Set<number>([now, now - 1, now - 2, defaultYear, year]);
    return Array.from(set).sort((a, b) => b - a);
  }, [defaultYear, year]);

  function pick(f: File) {
    if (!allowed(f.name)) {
      toast.error("Yalnızca .xlsx, .xlsm ve .csv dosyaları yüklenebilir.");
      return;
    }
    setFile(f);
    const g = guess(f.name);
    if (g.year) setYear(g.year);
    if (g.month) setMonth(g.month);
  }

  async function submit() {
    if (!file) {
      toast.error("Önce bir dosya seçin.");
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      await uploadFile({
        file,
        categoryId,
        year,
        month,
        onProgress: setProgress,
      });
      toast.success("Dosya yüklendi.");
      onUploaded();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Yükleme başarısız.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog title="Excel Yükle" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pick(f);
          }}
          style={{
            border: `1px dashed ${dragOver ? "var(--yellow)" : "var(--line)"}`,
            borderRadius: 8,
            padding: "30px 20px",
            textAlign: "center",
            cursor: "pointer",
            color: dragOver ? "var(--yellow)" : "var(--muted)",
            background: "var(--bg)",
            transition: ".15s",
          }}
        >
          <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
            <IconUpload size={28} />
            {file ? (
              <div className="mono" style={{ fontSize: 13, color: "var(--txt)" }}>
                {file.name}
              </div>
            ) : (
              <div style={{ fontSize: 13 }}>
                Dosyayı buraya sürükleyin veya tıklayıp seçin
              </div>
            )}
            <div className="mono" style={{ fontSize: 10, color: "var(--muted2)" }}>
              .xlsx · .xlsm · .csv
            </div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xlsm,.csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
            e.target.value = "";
          }}
        />

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="fld-label">Yıl</label>
            <select
              className="fld-input mono"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="fld-label">Ay</label>
            <select
              className="fld-input mono"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS_TR.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {busy && (
          <div style={{ height: 6, background: "var(--bg)", borderRadius: 4 }}>
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--yellow)",
                borderRadius: 4,
                transition: "width .2s",
              }}
            />
          </div>
        )}

        <button onClick={submit} disabled={busy} style={primaryBtn}>
          {busy ? `Yükleniyor… ${progress}%` : "Yükle"}
        </button>
      </div>
    </Dialog>
  );
}

const primaryBtn: React.CSSProperties = {
  width: "100%",
  background: "var(--yellow)",
  color: "#000",
  border: "none",
  borderRadius: 4,
  padding: 13,
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};
