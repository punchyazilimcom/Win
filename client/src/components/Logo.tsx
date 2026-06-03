import { useAuth } from "../context/AuthContext";

interface LogoProps {
  size?: number;
  fontSize?: number;
  radius?: number;
}

/**
 * Brand logo. Uses settings.app.logoUrl when present, otherwise falls back to
 * a yellow square with a "B".
 */
export default function Logo({ size = 38, fontSize = 20, radius = 5 }: LogoProps) {
  const { settings } = useAuth();
  if (settings.logoUrl) {
    return (
      <img
        src={settings.logoUrl}
        alt="logo"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "var(--yellow)",
        display: "grid",
        placeItems: "center",
        color: "#000",
        fontWeight: 800,
        fontSize,
        flexShrink: 0,
      }}
    >
      B
    </div>
  );
}
