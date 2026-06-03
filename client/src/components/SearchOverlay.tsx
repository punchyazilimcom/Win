import { useEffect, useMemo, useState } from "react";
import { listAllFiles, listCategories } from "../lib/firestore";
import { formatBytes } from "../theme";
import { useToast } from "./Toast";
import { IconSearch, IconX } from "./icons";
import type { Category, FileItem } from "../lib/types";

interface Props {
  onClose: () => void;
  onOpen: (f: FileItem) => void;
  busyId?: string | null;
}

export default function SearchOverlay({ onClose, onOpen, busyId }: Props) {
  const toast = useToast();
  const [term, setTerm] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [cats, setCats] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [f, c] = await Promise.all([listAllFiles(), listCategories()]);
        setFiles(f);
        setCats(Object.fromEntries(c.map((x) => [x.id, x])));
      } catch (e: any) {
        toast.error(e?.message || "Arama verisi yüklenemedi.");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const t = term.trim().toLowerCase();
    if (!t) return files.slice(0, 20);
    return files.filter((f) => f.name.toLowerCase().includes(t)).slice(0, 40);
  }, [term, files]);

  return (
    <div
      onClick={onClose}
      className="anim-fade"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 450,
        background: "rgba(5,5,5,.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        paddingTop: "8vh",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "78vh",
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span style={{ color: "var(--muted)" }}>
            <IconSearch size={18} />
          </span>
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Dosya adı ara…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--txt)",
              fontSize: 15,
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              border: "1px solid var(--line)",
              borderRadius: 5,
              background: "var(--bg)",
              color: "var(--muted)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <IconX size={16} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: 8 }}>
          {loading && (
            <div className="mono" style={{ padding: 18, color: "var(--muted)" }}>
              Yükleniyor…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="mono" style={{ padding: 18, color: "var(--muted)" }}>
              Sonuç bulunamadı.
            </div>
          )}
          {results.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 6,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--card2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, wordBreak: "break-word" }}>
                  {f.name}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--muted2)", marginTop: 3 }}
                >
                  {cats[f.categoryId]?.name || "—"} · {String(f.month).padStart(2, "0")}.
                  {f.year} · {formatBytes(f.size)} · v{f.version}
                </div>
              </div>
              <button
                disabled={busyId === f.id}
                onClick={() => onOpen(f)}
                className="mono"
                style={{
                  background: "var(--yellow)",
                  color: "#000",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 14px",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Aç
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
