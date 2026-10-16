export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const initials = (n) => String(n || "?").trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
export const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

let toastTimer;
export function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600);
}

const COLORS = ["#2563eb", "#9333ea", "#ea580c", "#16a34a", "#db2777", "#0891b2"];
export const colorFor = (s) => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export function fmtTime(ts) {
  const d = ts && typeof ts.toDate === "function" ? ts.toDate() : ts instanceof Date ? ts : null;
  if (!d) return "Just now";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

// Only allow http(s) links (or files on this site, like assets/stories/x.jpg) for photos, videos and links.
export function safeUrl(u) {
  if (!u) return "";
  try { const x = new URL(u, location.href); return x.protocol === "https:" || x.protocol === "http:" ? x.href : ""; } catch { return ""; }
}
