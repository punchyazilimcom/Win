// Central design tokens (mirror of CSS variables / tailwind config).
export const theme = {
  bg: "#0D0D0D",
  card: "#131313",
  card2: "#171717",
  line: "#262626",
  line2: "#1c1c1c",
  yellow: "#F4DF16",
  yellowDim: "#9c9112",
  txt: "#f4f4f0",
  muted: "#8a8a83",
  muted2: "#5a5a55",
  ok: "#5fd36a",
  radius: 6,
} as const;

// Accent palette offered in the category color picker.
export const ACCENT_COLORS = [
  "#F4DF16",
  "#5fb8ff",
  "#ff8f5f",
  "#b88dff",
  "#5fd36a",
  "#ff6b8a",
  "#56d4c4",
  "#d4a256",
] as const;

export const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function monthName(m: number): string {
  return MONTHS_TR[(m - 1 + 12) % 12] || "";
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  const val = n >= 100 || i === 0 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${val} ${units[i]}`;
}
