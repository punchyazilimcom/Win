import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "ok" | "error" | "info";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
  success: (m: string) => void;
  error: (m: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = ++counter;
      setItems((prev) => [...prev, { id, message, kind }]);
      window.setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const api: ToastApi = {
    show,
    success: (m) => show(m, "ok"),
    error: (m) => show(m, "error"),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 500,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 360,
        }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            className="mono anim-fade"
            style={{
              cursor: "pointer",
              background: "var(--card)",
              border: `1px solid ${
                t.kind === "error"
                  ? "#5a2a2a"
                  : t.kind === "ok"
                  ? "#2a5a32"
                  : "var(--line)"
              }`,
              borderLeft: `3px solid ${
                t.kind === "error"
                  ? "#e0584f"
                  : t.kind === "ok"
                  ? "var(--ok)"
                  : "var(--yellow)"
              }`,
              borderRadius: 6,
              padding: "11px 16px",
              fontSize: 12,
              color: "var(--txt)",
              boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
