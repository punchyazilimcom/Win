import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./Toast";
import Logo from "./Logo";
import { IconGear, IconSearch, IconLogout } from "./icons";

interface HeaderProps {
  onSearch?: () => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const { settings, displayName, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const initials = (displayName || "K")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const iconBtn: React.CSSProperties = {
    width: 38,
    height: 38,
    border: "1px solid var(--line)",
    borderRadius: 5,
    background: "var(--card)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    color: "var(--muted)",
    transition: ".15s",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "18px 28px",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        <Logo />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>
            {settings.appName || "Excel Yöneticisi"}
          </div>
          <small
            style={{
              display: "block",
              fontSize: 10,
              letterSpacing: ".22em",
              color: "var(--muted2)",
              fontWeight: 500,
              textTransform: "uppercase",
            }}
          >
            Punch Yazılım
          </small>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {onSearch && (
        <button
          title="Ara"
          style={iconBtn}
          onClick={onSearch}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--txt)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          <IconSearch size={18} />
        </button>
      )}

      <button
        title="Ayarlar"
        style={iconBtn}
        onClick={() => navigate("/settings")}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--txt)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
      >
        <IconGear size={18} />
      </button>

      <button
        title="Çıkış"
        style={iconBtn}
        onClick={async () => {
          await logout();
          toast.show("Çıkış yapıldı.");
          navigate("/login");
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--txt)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
      >
        <IconLogout size={18} />
      </button>

      <div
        title={displayName}
        style={{
          width: 38,
          height: 38,
          borderRadius: 5,
          background: "var(--card2)",
          border: "1px solid var(--line)",
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          fontSize: 13,
          color: "var(--yellow)",
        }}
      >
        {initials}
      </div>
    </div>
  );
}
