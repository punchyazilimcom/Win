import { useEffect, useState } from "react";
import Dialog from "./Dialog";
import { listVersions, revertToVersion } from "../lib/firestore";
import { formatBytes } from "../theme";
import { useToast } from "./Toast";
import type { FileItem } from "../lib/types";

interface Props {
  file: FileItem;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export default function VersionHistory({
  file,
  canManage,
  onClose,
  onChanged,
}: Props) {
  const toast = useToast();
  const [versions, setVersions] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setVersions(await listVersions(file.categoryId, file.name));
    } catch (e: any) {
      toast.error(e?.message || "Sürümler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id]);

  async function revert(v: FileItem) {
    try {
      await revertToVersion(v);
      toast.success(`v${v.version} geçerli sürüm yapıldı.`);
      await load();
      onChanged();
    } catch (e: any) {
      toast.error(e?.message || "Geri alınamadı.");
    }
  }

  return (
    <Dialog title={`Sürüm Geçmişi · ${file.name}`} onClose={onClose} width={520}>
      {loading ? (
        <div className="mono" style={{ color: "var(--muted)" }}>
          Yükleniyor…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {versions.map((v) => (
            <div
              key={v.id}
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
                className="mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: v.isLatest ? "var(--yellow)" : "var(--muted)",
                  minWidth: 34,
                }}
              >
                v{v.version}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--muted2)", flex: 1 }}
              >
                {formatBytes(v.size)}
                {v.isLatest ? " · güncel" : ""}
              </span>
              {canManage && !v.isLatest && (
                <button
                  onClick={() => revert(v)}
                  className="mono"
                  style={{
                    background: "var(--card2)",
                    border: "1px solid var(--line)",
                    color: "var(--txt)",
                    borderRadius: 4,
                    padding: "5px 12px",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Bu sürüme dön
                </button>
              )}
            </div>
          ))}
          {versions.length === 0 && (
            <div className="mono" style={{ color: "var(--muted)" }}>
              Sürüm bulunamadı.
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
