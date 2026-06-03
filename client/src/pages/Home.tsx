import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CategoryCard from "../components/CategoryCard";
import AddCategoryCard from "../components/AddCategoryCard";
import CategoryModal from "../components/CategoryModal";
import SearchOverlay from "../components/SearchOverlay";
import FileCard from "../components/FileCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { useFileOpener } from "../hooks/useFileOpener";
import {
  createCategory,
  deleteCategory,
  listAllFiles,
  listCategories,
  listRecent,
  updateCategory,
} from "../lib/firestore";
import type { Category, FileItem } from "../lib/types";

export default function Home() {
  const { isAdmin, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { open, busyId, viewer } = useFileOpener();

  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, files] = await Promise.all([listCategories(), listAllFiles()]);
      const c: Record<string, number> = {};
      for (const f of files) c[f.categoryId] = (c[f.categoryId] || 0) + 1;
      setCategories(cats);
      setCounts(c);
      if (user) setRecent(await listRecent(user.uid, 6));
    } catch (e: any) {
      toast.error(e?.message || "Kategoriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(data: {
    name: string;
    iconUrl: string;
    color: string;
    order: number;
  }) {
    if (editing) {
      await updateCategory(editing.id, data);
      toast.success("Kategori güncellendi.");
    } else {
      await createCategory(data);
      toast.success("Kategori oluşturuldu.");
    }
    setEditing(null);
    await load();
  }

  async function handleDelete(c: Category) {
    if (!window.confirm(`"${c.name}" kategorisini silmek istiyor musunuz?`)) return;
    try {
      await deleteCategory(c.id);
      toast.success("Kategori silindi.");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Silinemedi.");
    }
  }

  const nextOrder = categories.length
    ? Math.max(...categories.map((c) => c.order ?? 0)) + 1
    : 0;

  return (
    <div>
      <Header onSearch={() => setSearchOpen(true)} />

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 28px 80px" }}>
        <div style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
            Kategoriler
          </h2>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            Bir kategoriye tıklayarak dosyalara ulaşın
          </div>
        </div>

        {loading ? (
          <div className="mono" style={{ color: "var(--muted)" }}>
            Yükleniyor…
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            {categories.map((c, i) => (
              <CategoryCard
                key={c.id}
                category={c}
                fileCount={counts[c.id] || 0}
                index={i}
                canManage={isAdmin}
                onOpen={(cat) => navigate(`/category/${cat.id}`)}
                onEdit={(cat) => {
                  setEditing(cat);
                  setModalOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
            {isAdmin && (
              <AddCategoryCard
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              />
            )}
          </div>
        )}

        {recent.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
              Son Açılanlar
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                gap: 12,
              }}
            >
              {recent.map((f, i) => (
                <FileCard
                  key={f.id}
                  file={f}
                  index={i}
                  busy={busyId === f.id}
                  onOpen={open}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <CategoryModal
          existing={editing}
          nextOrder={nextOrder}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
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
