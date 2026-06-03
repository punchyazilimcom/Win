import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import { ACCENT_COLORS, formatBytes } from "../theme";
import {
  listUsers,
  setUserRole,
  saveSettings,
  uploadLogo,
  listTrash,
  restoreFile,
  listCategories,
  deleteCategory,
  reorderCategories,
} from "../lib/firestore";
import CategoryModal from "./CategoryModal";
import { createCategory, updateCategory } from "../lib/firestore";
import type { Category, FileItem, Role, UserDoc } from "../lib/types";
import { IconUpload, IconRestore, IconEdit, IconTrash } from "./icons";

type Tab = "brand" | "categories" | "users" | "trash";

export default function SettingsPanel() {
  const { settings, refreshSettings, isAdmin } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("brand");

  const tabs: { key: Tab; label: string; adminOnly?: boolean }[] = [
    { key: "brand", label: "Marka" },
    { key: "categories", label: "Kategoriler", adminOnly: true },
    { key: "users", label: "Kullanıcılar", adminOnly: true },
    { key: "trash", label: "Çöp Kutusu", adminOnly: true },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 24,
          flexWrap: "wrap",
          borderBottom: "1px solid var(--line)",
          paddingBottom: 14,
        }}
      >
        {tabs
          .filter((t) => !t.adminOnly || isAdmin)
          .map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="mono"
              style={{
                background: tab === t.key ? "var(--yellow)" : "transparent",
                color: tab === t.key ? "#000" : "var(--muted)",
                border: `1px solid ${tab === t.key ? "var(--yellow)" : "var(--line)"}`,
                borderRadius: 5,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: tab === t.key ? 700 : 400,
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === "brand" && (
        <BrandTab
          settings={settings}
          isAdmin={isAdmin}
          onSaved={refreshSettings}
          toast={toast}
        />
      )}
      {tab === "categories" && isAdmin && <CategoriesTab toast={toast} />}
      {tab === "users" && isAdmin && <UsersTab toast={toast} />}
      {tab === "trash" && isAdmin && <TrashTab toast={toast} />}
    </div>
  );
}

/* ------------------------------- brand ------------------------------ */

function BrandTab({
  settings,
  isAdmin,
  onSaved,
  toast,
}: {
  settings: { appName: string; brandColor: string; logoUrl: string };
  isAdmin: boolean;
  onSaved: () => Promise<void>;
  toast: ReturnType<typeof useToast>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [appName, setAppName] = useState(settings.appName);
  const [brandColor, setBrandColor] = useState(settings.brandColor);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [busy, setBusy] = useState(false);

  async function uploadLogoFile(f: File) {
    setBusy(true);
    try {
      const url = await uploadLogo(f);
      setLogoUrl(url);
      toast.success("Logo yüklendi.");
    } catch (e: any) {
      toast.error(e?.message || "Logo yüklenemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      await saveSettings({ appName, brandColor, logoUrl });
      await onSaved();
      toast.success("Ayarlar kaydedildi.");
    } catch (e: any) {
      toast.error(e?.message || "Kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="mono" style={{ color: "var(--muted)" }}>
        Marka ayarlarını yalnızca yöneticiler değiştirebilir.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 460 }}>
      <div>
        <label className="fld-label">Uygulama Adı</label>
        <input
          className="fld-input"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
        />
      </div>

      <div>
        <label className="fld-label">Logo</label>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 6,
              background: logoUrl ? "transparent" : "var(--yellow)",
              display: "grid",
              placeItems: "center",
              color: "#000",
              fontWeight: 800,
              fontSize: 24,
              overflow: "hidden",
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              "B"
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="mono"
            style={ghostBtn}
          >
            <IconUpload size={14} /> Logo Yükle
          </button>
          {logoUrl && (
            <button
              onClick={() => setLogoUrl("")}
              className="mono"
              style={{ ...ghostBtn, color: "var(--muted)" }}
            >
              Kaldır
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadLogoFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div>
        <label className="fld-label">Ana Renk</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setBrandColor(c)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                background: c,
                border:
                  brandColor === c ? "2px solid var(--txt)" : "2px solid transparent",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      <button onClick={save} disabled={busy} style={primaryBtn}>
        {busy ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}

/* ----------------------------- categories --------------------------- */

function CategoriesTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setCats(await listCategories());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function move(index: number, dir: -1 | 1) {
    const next = [...cats];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCats(next);
    try {
      await reorderCategories(next);
      toast.success("Sıra güncellendi.");
    } catch (e: any) {
      toast.error(e?.message || "Sıralanamadı.");
      load();
    }
  }

  async function remove(c: Category) {
    if (!window.confirm(`"${c.name}" silinsin mi?`)) return;
    await deleteCategory(c.id);
    toast.success("Silindi.");
    load();
  }

  const nextOrder = cats.length ? Math.max(...cats.map((c) => c.order ?? 0)) + 1 : 0;

  return (
    <div>
      <button
        onClick={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        style={{ ...primaryBtn, width: "auto", padding: "10px 16px", marginBottom: 18 }}
      >
        + Kategori Ekle
      </button>

      {loading ? (
        <div className="mono" style={{ color: "var(--muted)" }}>
          Yükleniyor…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cats.map((c, i) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: "var(--bg)",
                border: "1px solid var(--line)",
                borderRadius: 6,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: c.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontWeight: 600 }}>{c.name}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button style={miniBtn} onClick={() => move(i, -1)} title="Yukarı">
                  ↑
                </button>
                <button style={miniBtn} onClick={() => move(i, 1)} title="Aşağı">
                  ↓
                </button>
                <button
                  style={miniBtn}
                  onClick={() => {
                    setEditing(c);
                    setModalOpen(true);
                  }}
                  title="Düzenle"
                >
                  <IconEdit size={14} />
                </button>
                <button style={miniBtn} onClick={() => remove(c)} title="Sil">
                  <IconTrash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <CategoryModal
          existing={editing}
          nextOrder={nextOrder}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={async (data) => {
            if (editing) {
              await updateCategory(editing.id, data);
              toast.success("Güncellendi.");
            } else {
              await createCategory(data);
              toast.success("Oluşturuldu.");
            }
            await load();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------- users ------------------------------ */

function UsersTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function changeRole(u: UserDoc, role: Role) {
    try {
      await setUserRole(u.uid, role);
      toast.success(`${u.displayName}: ${role}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Rol değiştirilemedi.");
    }
  }

  if (loading)
    return (
      <div className="mono" style={{ color: "var(--muted)" }}>
        Yükleniyor…
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {users.map((u) => (
        <div
          key={u.uid}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            background: "var(--bg)",
            border: "1px solid var(--line)",
            borderRadius: 6,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{u.displayName}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>
              {u.email || u.uid}
            </div>
          </div>
          <select
            className="mono"
            value={u.role}
            onChange={(e) => changeRole(u, e.target.value as Role)}
            style={{
              background: "var(--card2)",
              border: "1px solid var(--line)",
              color: u.role === "admin" ? "var(--yellow)" : "var(--txt)",
              borderRadius: 5,
              padding: "7px 10px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <option value="admin">admin</option>
            <option value="viewer">viewer</option>
          </select>
        </div>
      ))}
      {users.length === 0 && (
        <div className="mono" style={{ color: "var(--muted)" }}>
          Kullanıcı bulunamadı.
        </div>
      )}
    </div>
  );
}

/* ------------------------------- trash ------------------------------ */

function TrashTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setItems(await listTrash());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function restore(f: FileItem) {
    try {
      await restoreFile(f.id);
      toast.success("Geri yüklendi.");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Geri yüklenemedi.");
    }
  }

  function daysLeft(f: FileItem): number {
    const ms =
      f.deletedAt && typeof (f.deletedAt as any).toMillis === "function"
        ? (f.deletedAt as any).toMillis()
        : 0;
    if (!ms) return 30;
    const elapsed = Date.now() - ms;
    return Math.max(0, 30 - Math.floor(elapsed / (24 * 3600 * 1000)));
  }

  if (loading)
    return (
      <div className="mono" style={{ color: "var(--muted)" }}>
        Yükleniyor…
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--muted2)", marginBottom: 8 }}>
        Silinen dosyalar 30 gün saklanır, sonra kalıcı olarak temizlenir.
      </div>
      {items.map((f) => (
        <div
          key={f.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            background: "var(--bg)",
            border: "1px solid var(--line)",
            borderRadius: 6,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{f.name}</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted2)" }}>
              {formatBytes(f.size)} · {daysLeft(f)} gün kaldı
            </div>
          </div>
          <button onClick={() => restore(f)} className="mono" style={ghostBtn}>
            <IconRestore size={14} /> Geri Al
          </button>
        </div>
      ))}
      {items.length === 0 && (
        <div className="mono" style={{ color: "var(--muted)" }}>
          Çöp kutusu boş.
        </div>
      )}
    </div>
  );
}

/* ------------------------------ styles ------------------------------ */

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

const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "var(--bg)",
  border: "1px solid var(--line)",
  color: "var(--txt)",
  borderRadius: 5,
  padding: "8px 12px",
  fontSize: 12,
  cursor: "pointer",
};

const miniBtn: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 5,
  border: "1px solid var(--line)",
  background: "var(--card2)",
  color: "var(--muted)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  fontSize: 13,
};
