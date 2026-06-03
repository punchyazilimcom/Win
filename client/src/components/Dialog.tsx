import type { ReactNode } from "react";
import { IconX } from "./icons";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export default function Dialog({ title, onClose, children, width = 440 }: Props) {
  return (
    <div
      onClick={onClose}
      className="anim-fade"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "rgba(5,5,5,.7)",
        backdropFilter: "blur(4px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
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
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
