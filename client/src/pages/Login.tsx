import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Logo from "../components/Logo";

export default function Login() {
  const { login, settings } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("E-posta ve şifre gerekli.");
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err: any) {
      const code = err?.code || "";
      const msg =
        code.includes("invalid-credential") ||
        code.includes("wrong-password") ||
        code.includes("user-not-found")
          ? "E-posta veya şifre hatalı."
          : code.includes("too-many-requests")
          ? "Çok fazla deneme. Lütfen sonra tekrar deneyin."
          : "Giriş başarısız. Bilgileri kontrol edin.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form
        onSubmit={submit}
        className="anim-fade"
        style={{
          width: "100%",
          maxWidth: 380,
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r)",
          padding: "38px 34px",
        }}
      >
        <div style={{ display: "grid", placeItems: "center", marginBottom: 22 }}>
          <Logo size={54} fontSize={28} radius={6} />
        </div>
        <h1
          style={{
            textAlign: "center",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-.02em",
          }}
        >
          {settings.appName || "Excel Yöneticisi"}
        </h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 13,
            margin: "6px 0 28px",
          }}
        >
          Devam etmek için giriş yapın
        </p>

        <div style={{ marginBottom: 14 }}>
          <label className="fld-label">E-posta</label>
          <input
            className="fld-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ad@punchyazilim.com"
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label className="fld-label">Şifre</label>
          <input
            className="fld-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          style={{
            width: "100%",
            background: "var(--yellow)",
            color: "#000",
            border: "none",
            borderRadius: 4,
            padding: 13,
            fontWeight: 800,
            fontSize: 14,
            cursor: busy ? "wait" : "pointer",
            marginTop: 10,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Giriş yapılıyor…" : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
