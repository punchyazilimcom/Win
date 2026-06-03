import { useEffect } from "react";
import Logo from "./Logo";
import { IconX } from "./icons";
import { closeSession } from "../lib/api";
import type { FileItem } from "../lib/types";

interface Props {
  file: FileItem;
  url: string;
  onClose: () => void;
}

/**
 * Fullscreen modal hosting the Guacamole iframe in which the real desktop
 * Excel session (with working VBA macros) is streamed. Closing the modal
 * releases the server-side session slot.
 */
export default function GuacamoleViewer({ file, url, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    closeSession(file.id);
    onClose();
  }

  return (
    <div
      className="anim-fade"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        background: "rgba(5,5,5,.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "13px 20px",
          background: "var(--card)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Logo size={30} fontSize={16} radius={4} />
        <div style={{ fontWeight: 700, fontSize: 14 }}>{file.name}</div>
        <div
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ok)",
            display: "flex",
            alignItems: "center",
            gap: 6,
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
          {file.hasMacro
            ? "Masaüstü Excel oturumu · Makrolar çalışıyor"
            : "Masaüstü Excel oturumu"}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleClose}
          title="Kapat (Esc)"
          style={{
            cursor: "pointer",
            color: "var(--muted)",
            width: 34,
            height: 34,
            border: "1px solid var(--line)",
            borderRadius: 5,
            display: "grid",
            placeItems: "center",
            background: "var(--bg)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#e0584f";
            e.currentTarget.style.color = "#e0584f";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--line)";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          <IconX size={18} />
        </button>
      </div>

      <div style={{ flex: 1, position: "relative", background: "#1b1b1b" }}>
        <iframe
          title={`excel-${file.id}`}
          src={url}
          allow="clipboard-read; clipboard-write; fullscreen"
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        />
      </div>
    </div>
  );
}
