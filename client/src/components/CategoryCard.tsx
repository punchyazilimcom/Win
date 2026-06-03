import { useState } from "react";
import type { Category } from "../lib/types";
import { IconArrow, IconFolder, IconEdit, IconTrash } from "./icons";

interface Props {
  category: Category;
  fileCount: number;
  index?: number;
  canManage?: boolean;
  onOpen: (c: Category) => void;
  onEdit?: (c: Category) => void;
  onDelete?: (c: Category) => void;
}

export default function CategoryCard({
  category,
  fileCount,
  index = 0,
  canManage = false,
  onOpen,
  onEdit,
  onDelete,
}: Props) {
  const [hover, setHover] = useState(false);
  const accent = category.color || "var(--yellow)";

  return (
    <div
      className="anim-pop"
      onClick={() => onOpen(category)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--card)",
        border: `1px solid ${hover ? "#383838" : "var(--line)"}`,
        borderRadius: "var(--r)",
        padding: 22,
        cursor: "pointer",
        transition: ".18s",
        position: "relative",
        overflow: "hidden",
        transform: hover ? "translateY(-2px)" : "none",
        animationDelay: `${0.04 * (index + 1)}s`,
      }}
    >
      {/* hover accent line */}
      <span
        style={{
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accent,
          opacity: hover ? 1 : 0,
          transition: ".18s",
        }}
      />

      {canManage && hover && (
        <div
          style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            title="Düzenle"
            onClick={() => onEdit?.(category)}
            style={miniBtn}
          >
            <IconEdit size={14} />
          </button>
          <button
            title="Sil"
            onClick={() => onDelete?.(category)}
            style={miniBtn}
          >
            <IconTrash size={14} />
          </button>
        </div>
      )}

      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 8,
          display: "grid",
          placeItems: "center",
          marginBottom: 16,
          background: `color-mix(in srgb, ${accent} 14%, transparent)`,
          color: accent,
          overflow: "hidden",
        }}
      >
        {category.iconUrl ? (
          <img
            src={category.iconUrl}
            alt=""
            style={{ width: 26, height: 26, objectFit: "contain" }}
          />
        ) : (
          <IconFolder size={24} />
        )}
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
        {category.name}
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--muted)",
            background: "var(--bg)",
            border: "1px solid var(--line)",
            padding: "3px 9px",
            borderRadius: 20,
          }}
        >
          {fileCount} dosya
        </span>
        <span
          style={{
            color: hover ? accent : "var(--muted2)",
            transform: hover ? "translateX(3px)" : "none",
            transition: ".18s",
            display: "grid",
            placeItems: "center",
          }}
        >
          <IconArrow size={18} />
        </span>
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
