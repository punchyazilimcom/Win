import { MONTHS_TR, monthName } from "../theme";
import { IconChevron } from "./icons";

interface Props {
  years: number[];
  year: number;
  month: number;
  count: number;
  onYear: (y: number) => void;
  onMonth: (m: number) => void;
}

export default function FilterBar({
  years,
  year,
  month,
  count,
  onYear,
  onMonth,
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 22,
        alignItems: "center",
      }}
    >
      <Select
        label="Yıl"
        value={String(year)}
        active={true}
        onChange={(v) => onYear(Number(v))}
        options={years.map((y) => ({ value: String(y), label: String(y) }))}
      />
      <Select
        label="Ay"
        value={String(month)}
        active={true}
        onChange={(v) => onMonth(Number(v))}
        options={MONTHS_TR.map((m, i) => ({ value: String(i + 1), label: m }))}
      />
      <span
        className="mono"
        style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}
      >
        <b style={{ color: "var(--txt)" }}>{count}</b> dosya · {monthName(month)} {year}
      </span>
    </div>
  );
}

function Select({
  label,
  value,
  active,
  options,
  onChange,
}: {
  label: string;
  value: string;
  active: boolean;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <label
        style={{
          position: "absolute",
          top: -7,
          left: 10,
          background: "var(--bg)",
          padding: "0 5px",
          fontSize: 9,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--muted2)",
          fontWeight: 700,
          zIndex: 1,
        }}
      >
        {label}
      </label>
      <select
        className="mono"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          background: "var(--card)",
          border: `1px solid ${active ? "var(--yellow)" : "var(--line)"}`,
          borderRadius: 5,
          color: active ? "var(--yellow)" : "var(--txt)",
          fontSize: 13,
          padding: "11px 38px 11px 14px",
          cursor: "pointer",
          outline: "none",
          minWidth: 120,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: "var(--muted)",
        }}
      >
        <IconChevron size={14} />
      </span>
    </div>
  );
}
