import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import FilterBar from "../components/FilterBar";
import FileCard from "../components/FileCard";
import UploadModal from "../components/UploadModal";
import VersionHistory from "../components/VersionHistory";
import SearchOverlay from "../components/SearchOverlay";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { useFileOpener } from "../hooks/useFileOpener";
import { listCategories, listFiles, trashFile } from "../lib/firestore";
import type { Category, FileItem } from "../lib/types";
import { IconPlus } from "../components/icons";

export default function CategoryView() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { open, busyId, viewer } = useFileOpener();

  const [category, setCategory] = useState<Category | null>(null);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [historyFile, setHistoryFile] = useState<FileItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const files = await listFiles(id);
      setAllFiles(files);
      // Default to the most recent year/month present.
      if (files.length) {
        const newest = files.reduce((a, b) =>
          a.year > b.year || (a.year === b.year && a.month >= b.month) ? a : b
        );
        setYear(newest.year);
        setMonth(newest.month);
      }
    } catch (e: any) {
      toast.error(e?.message || "Dosyalar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    (async () => {
      try {
        const cats = await listCategories();
        setCategory(cats.find((c) => c.id === id) || null);
      } catch {
        /* ignore */
      }
    })();
    loadFiles();
  }, [id, loadFiles]);

  const years = useMemo(() => {
    const set = new Set<number>(allFiles.map((f) => f.year));
    set.add(new Date().getFullYear());
    set.add(year);
    return Array.from(set).sort((a, b) => b - a);
  }, [allFiles, year]);

  const filtered = useMemo(
    () => allFiles.filter((f) => f.year === year && f.month === month),
    [allFiles, year, month]
  );

  async function handleTrash(f: FileItem) {
    if (!window.confirm(`"${f.name}" dosyasını çöp kutusuna taşımak istiyor musunuz?`))
      return;
    try {
      await trashFile(f.id);
      toast.success("Dosya çöp kutusuna taşındı.");
      await loadFiles();
    } catch (e: any) {
      toast.error(e?.message || "Silinemedi.");
    }
  }

  return (
    <div>
      <Header onSearch={() => setSearchOpen(true)} />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 28px 80px" }}>
        <div
          className="mono"
          style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 8 }}
        >
          <span
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Ana Ekran
          </span>{" "}
          / <b style={{ color: "var(--yellow)", fontWeight: 500 }}>
            {category?.name || "…"}
          </b>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 26,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
              {category?.name || "Kategori"}
            </h2>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              Yıl ve ay seçerek dosyaları filtreleyin
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setUploadOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "var(--yellow)",
                color: "#000",
                border: "none",
                borderRadius: 4,
                padding: "10px 18px",
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <IconPlus size={16} /> Excel Yükle
            </button>
          )}
        </div>

        <FilterBar
          years={years}
          year={year}
          month={month}
          count={filtered.length}
          onYear={setYear}
          onMonth={setMonth}
        />

        {loading ? (
          <div className="mono" style={{ color: "var(--muted)" }}>
            Yükleniyor…
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="mono"
            style={{
              color: "var(--muted)",
              border: "1px dashed var(--line)",
              borderRadius: 8,
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            Bu ay için dosya yok.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: 12,
            }}
          >
            {filtered.map((f, i) => (
              <FileCard
                key={f.id}
                file={f}
                index={i}
                canManage={isAdmin}
                busy={busyId === f.id}
                onOpen={open}
                onHistory={(file) => setHistoryFile(file)}
                onTrash={handleTrash}
              />
            ))}
          </div>
        )}
      </div>

      {uploadOpen && (
        <UploadModal
          categoryId={id}
          defaultYear={year}
          defaultMonth={month}
          onClose={() => setUploadOpen(false)}
          onUploaded={loadFiles}
        />
      )}

      {historyFile && (
        <VersionHistory
          file={historyFile}
          canManage={isAdmin}
          onClose={() => setHistoryFile(null)}
          onChanged={loadFiles}
        />
      )}

      {searchOpen && (
        <SearchOverlay
          busyId={busyId}
          onClose={() => setSearchOpen(false)}
          onOpen={(f) => {
            setSearchOpen(false);
            open(f);
          }}
        />
      )}

      {viewer}
    </div>
  );
}
