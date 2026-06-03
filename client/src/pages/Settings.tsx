import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SettingsPanel from "../components/SettingsPanel";

export default function Settings() {
  const navigate = useNavigate();
  return (
    <div>
      <Header />
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "34px 28px 80px" }}>
        <div
          className="mono"
          style={{ fontSize: 12, color: "var(--muted2)", marginBottom: 8 }}
        >
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            Ana Ekran
          </span>{" "}
          / <b style={{ color: "var(--yellow)", fontWeight: 500 }}>Ayarlar</b>
        </div>
        <h2
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-.02em",
            marginBottom: 26,
          }}
        >
          Ayarlar
        </h2>
        <SettingsPanel />
      </div>
    </div>
  );
}
