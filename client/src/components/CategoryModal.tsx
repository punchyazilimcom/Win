import { useRef, useState } from "react";
import Dialog from "./Dialog";
import { ACCENT_COLORS } from "../theme";
import { uploadCategoryIcon } from "../lib/firestore";
import { useToast } from "./Toast";
import type { Category } from "../lib/types";
import { IconFolder, IconUpload } from "./icons";

interface Props {
  existing?: Category | null;
  nextOrder: number;
  onClose: () => void;
  onSave: (data: {
    name: string;
    iconUrl: string;
    color: string;
    order: number;
  }) => Promise<void>;
}

export default function CategoryModal({
  existing,
  nextOrder,
  onClose,
  onSave,
}: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(existing?.name || "");
  const [color, setColor] = useState(existing?.color || ACCENT_COLORS[0]);
  const [iconUrl, setIconUrl] = useState(existing?.iconUrl || "");
  const [order, setOrder] = useState<number>(existing?.order ?? nextOrder);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function pickIcon(file: File) {
    setUploading(true);
    try {
      const url = await uploadCategoryIcon(file);
      setIconUrl(url);
      toast.success("İkon yüklendi.");
    } catch (e: any) {
      toast.error(e?.message || "İkon yüklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!name.trim()) {
      toast.error("Kategori adı gerekli.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), iconUrl, color, order: Number(order) || 0 });
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog title={existing ? "Kategoriyi Düzenle" : "Yeni Kategori"} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="fld-label">Ad</label>
          <input
            className="fld-input"
            value={name}
            autoFocus
            placeholder="Örn. Muhasebe"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="fld-label">İkon</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 8,
                display: "grid",
                placeItems: "center",
                background: `color-mix(in srgb, ${color} 14%, transparent)`,
                color,
                overflow: "hidden",
              }}
            >
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt=""
                  style={{ width: 30, height: 30, objectFit: "contain" }}
                />
              ) : (
                <IconFolder size={26} />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="mono"
              disabled={uploading}
              style={ghostBtn}
            >
              <IconUpload size={14} />
              {uploading ? "Yükleniyor…" : "İkon Yükle"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickIcon(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div>
          <label className="fld-label">Vurgu Rengi</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: c,
                  border:
                    color === c ? "2px solid var(--txt)" : "2px solid transparent",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="fld-label">Sıra</label>
          <input
            className="fld-input mono"
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
          />
        </div>

        <button onClick={submit} disabled={saving} style={primaryBtn}>
          {saving ? "Kaydediliyor…" : existing ? "Güncelle" : "Oluştur"}
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

const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: "var(--bg)",
  border: "1px solid var(--line)",
  color: "var(--txt)",
  borderRadius: 5,
  padding: "9px 14px",
  fontSize: 12,
  cursor: "pointer",
};
