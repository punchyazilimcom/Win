import { useState } from "react";
import { IconPlus } from "./icons";

export default function AddCategoryCard({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px dashed ${hover ? "var(--yellow)" : "#2e2e2e"}`,
        borderRadius: "var(--r)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: hover ? "var(--yellow)" : "var(--muted2)",
        minHeight: 170,
        gap: 10,
        cursor: "pointer",
        transition: ".18s",
      }}
    >
      <IconPlus size={26} />
      <span style={{ fontSize: 14, fontWeight: 700 }}>Kategori Ekle</span>
    </div>
  );
}
