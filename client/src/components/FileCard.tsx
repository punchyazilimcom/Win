import { useState } from "react";
import type { FileItem } from "../lib/types";
import { formatBytes } from "../theme";
import { IconHistory, IconTrash } from "./icons";

interface Props {
  file: FileItem;
  index?: number;
  canManage?: boolean;
  busy?: boolean;
  onOpen: (f: FileItem) => void;
  onHistory?: (f: FileItem) => void;
  onTrash?: (f: FileItem) => void;
}

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export default function FileCard({
  file,
  index = 0,
  canManage = false,
  busy = false,
  onOpen,
  onHistory,
  onTrash,
}: Props) {
  const [hover, setHover] = useState(false);
  const ext = extOf(file.name);
  const isXlsm = ext === "xlsm";

  // green for xlsm (macro), blue for xlsx, grey-ish for csv
  const iconStyle: React.CSSProperties = isXlsm
    ? { background: "#0e2417", borderColor: "#1c4a30", color: "#3ec06b" }
    : ext === "xlsx"
    ? { background: "#0e1d24", borderColor: "#1c3a4a", color: "#3ea0c0" }
    : { background: "#241f0e", borderColor: "#4a401c", color: "#c0a83e" };

  const mm = String(file.month).padStart(2, "0");

  return (
    <div
      className="anim-pop"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--card)",
        border: `1px solid ${hover ? "#383838" : "var(--line)"}`,
        borderRadius: "var(--r)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: ".15s",
        animationDelay: `${0.04 * (index + 1)}s`,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          className="mono"
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: "1px solid",
            display: "grid",
            placeItems: "center",
            fontWeight: 700,
            fontSize: 12,
            flexShrink: 0,
            ...iconStyle,
          }}
        >
          {ext || "xls"}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.3,
              wordBreak: "break-word",
            }}
          >
            {file.name}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--muted2)",
              marginTop: 5,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>
              {mm}.{file.year}
            </span>
            <span>·</span>
            <span>{formatBytes(file.size)}</span>
            <span>·</span>
            <span>v{file.version}</span>
          </div>
        </div>

        {canManage && hover && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {onHistory && (
              <button title="Sürüm geçmişi" style={miniBtn} onClick={() => onHistory(file)}>
                <IconHistory size={14} />
              </button>
            )}
            {onTrash && (
              <button title="Çöp kutusuna taşı" style={miniBtn} onClick={() => onTrash(file)}>
                <IconTrash size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--line2)",
          paddingTop: 11,
        }}
      >
        {file.hasMacro ? (
          <span
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ok)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--ok)",
                boxShadow: "0 0 6px var(--ok)",
                display: "inline-block",
              }}
            />
            Makro aktif
          </span>
        ) : (
          <span className="mono" style={{ fontSize: 10, color: "var(--muted2)" }}>
            — makrosuz
          </span>
        )}

        <button
          disabled={busy}
          onClick={() => onOpen(file)}
          className="mono"
          style={{
            background: "var(--yellow)",
            color: "#000",
            border: "none",
            borderRadius: 4,
            padding: "7px 16px",
            fontWeight: 700,
            fontSize: 12,
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.6 : 1,
            transition: ".15s",
          }}
        >
          {busy ? "…" : "Aç"}
        </button>
      </div>
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 5,
  border: "1px solid var(--line)",
  background: "var(--bg)",
  color: "var(--muted)",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};
