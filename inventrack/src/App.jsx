import { useState, useEffect } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_PRODUCTS = [
  { id: 1, name: "MacBook Pro 16\"", sku: "MBP-001", category: "Electronics", supplier: "Apple Inc", qty: 145, price: 2499, reorder: 20, warehouse: "Warehouse A", status: "In Stock" },
  { id: 2, name: "iPhone 14 Pro", sku: "IPH-014", category: "Electronics", supplier: "Apple Inc", qty: 289, price: 999, reorder: 30, warehouse: "Warehouse A", status: "In Stock" },
  { id: 3, name: "AirPods Pro", sku: "APD-003", category: "Electronics", supplier: "Apple Inc", qty: 23, price: 249, reorder: 25, warehouse: "Warehouse B", status: "Low Stock" },
  { id: 4, name: "Mechanical Keyboard", sku: "KBD-007", category: "Accessories", supplier: "Logitech", qty: 7, price: 89, reorder: 15, warehouse: "Warehouse A", status: "Low Stock" },
  { id: 5, name: "USB-C Hub 7-in-1", sku: "HUB-012", category: "Accessories", supplier: "Anker", qty: 3, price: 45, reorder: 10, warehouse: "Warehouse B", status: "Critical" },
  { id: 6, name: "4K Monitor 27\"", sku: "MON-027", category: "Electronics", supplier: "LG", qty: 64, price: 599, reorder: 10, warehouse: "Warehouse A", status: "In Stock" },
  { id: 7, name: "Wireless Mouse", sku: "MOU-008", category: "Accessories", supplier: "Logitech", qty: 112, price: 59, reorder: 20, warehouse: "Warehouse C", status: "In Stock" },
  { id: 8, name: "HDMI Cable 2m", sku: "CAB-HDMI", category: "Cables", supplier: "Belkin", qty: 12, price: 18, reorder: 30, warehouse: "Warehouse B", status: "Low Stock" },
  { id: 9, name: "Standing Desk", sku: "DSK-001", category: "Furniture", supplier: "FlexiSpot", qty: 18, price: 449, reorder: 5, warehouse: "Warehouse C", status: "In Stock" },
  { id: 10, name: "Webcam 4K", sku: "CAM-4K1", category: "Electronics", supplier: "Logitech", qty: 77, price: 199, reorder: 15, warehouse: "Warehouse A", status: "In Stock" },
];

const MOCK_USERS = [
  { id: 1, name: "John Smith", email: "john@company.com", role: "Admin", status: "Active", joined: "2023-01-15" },
  { id: 2, name: "Jane Doe", email: "jane@company.com", role: "Manager", status: "Active", joined: "2023-03-22" },
  { id: 3, name: "Bob Wilson", email: "bob@company.com", role: "Staff", status: "Inactive", joined: "2023-06-10" },
  { id: 4, name: "Alice Brown", email: "alice@company.com", role: "Viewer", status: "Active", joined: "2024-01-05" },
];

const MOCK_ACTIVITY = [
  { id: 1, action: "Stock IN", item: "iPhone 14 Pro (+50)", user: "Jane Doe", time: "2 min ago", type: "in" },
  { id: 2, action: "Order Created", item: "PO-2026-089", user: "John Smith", time: "18 min ago", type: "order" },
  { id: 3, action: "Stock OUT", item: "MacBook Pro (-12)", user: "Bob Wilson", time: "1 hr ago", type: "out" },
  { id: 4, action: "User Updated", item: "Alice Brown - role changed", user: "John Smith", time: "3 hr ago", type: "admin" },
  { id: 5, action: "Low Stock Alert", item: "USB-C Hub (3 remaining)", user: "System", time: "5 hr ago", type: "alert" },
];

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0b0f;
    --surface: #12141a;
    --surface2: #1a1d26;
    --border: #23263a;
    --accent: #6c63ff;
    --accent2: #00e5a0;
    --accent3: #ff6b6b;
    --accent4: #ffd166;
    --text: #e8eaf6;
    --muted: #6b7280;
    --sidebar-w: 240px;
    --radius: 14px;
    --radius-sm: 8px;
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* ── LAYOUT ── */
  .app-layout { display: flex; min-height: 100vh; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0;
    height: 100vh;
    z-index: 100;
    transition: transform 0.3s ease;
  }

  .logo {
    padding: 24px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px; color: var(--text); }
  .logo-sub { font-size: 11px; color: var(--muted); font-weight: 400; }

  .nav-section { padding: 16px 12px 8px; flex: 1; overflow-y: auto; }
  .nav-label { font-size: 10px; font-weight: 600; color: var(--muted); letter-spacing: 1.5px; text-transform: uppercase; padding: 0 8px 8px; }

  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 14px;
    color: var(--muted);
    transition: all 0.2s;
    margin-bottom: 2px;
    font-weight: 500;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: linear-gradient(135deg, rgba(108,99,255,0.2), rgba(0,229,160,0.1)); color: var(--accent2); border: 1px solid rgba(108,99,255,0.3); }
  .nav-icon { width: 18px; text-align: center; font-size: 16px; }
  .nav-badge { margin-left: auto; background: var(--accent3); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 20px; }

  .sidebar-footer { padding: 16px 12px; border-top: 1px solid var(--border); }
  .user-card { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--radius-sm); }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; font-family: 'Syne', sans-serif; }
  .user-info-name { font-size: 13px; font-weight: 600; }
  .user-info-role { font-size: 11px; color: var(--muted); }

  /* ── MAIN ── */
  .main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; min-height: 100vh; }

  .topbar {
    height: 64px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center;
    padding: 0 28px;
    gap: 16px;
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; flex: 1; }
  .topbar-search {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: 8px 14px;
    font-size: 13px; color: var(--muted);
    width: 220px;
  }
  .icon-btn {
    width: 36px; height: 36px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; font-size: 16px;
  }
  .icon-btn:hover { background: var(--border); }
  .notif-dot { position: relative; }
  .notif-dot::after { content: ''; position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; background: var(--accent3); border-radius: 50%; border: 2px solid var(--surface); }

  .page-content { padding: 28px; flex: 1; }

  /* ── CARDS / KPI ── */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }

  .kpi-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, border-color 0.2s;
    cursor: default;
  }
  .kpi-card:hover { transform: translateY(-2px); border-color: var(--accent); }
  .kpi-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--kpi-color, var(--accent));
    border-radius: var(--radius) var(--radius) 0 0;
  }
  .kpi-icon { font-size: 28px; margin-bottom: 12px; }
  .kpi-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 4px; }
  .kpi-label { font-size: 12px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-trend { font-size: 12px; margin-top: 8px; display: flex; align-items: center; gap: 4px; }
  .trend-up { color: var(--accent2); }
  .trend-down { color: var(--accent3); }

  /* ── GRID 2-COL ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .grid-3-1 { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }

  /* ── PANEL ── */
  .panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .panel-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; }
  .panel-body { padding: 20px; }

  /* ── CHART BARS ── */
  .chart-bars { display: flex; align-items: flex-end; gap: 8px; height: 120px; }
  .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .bar-wrap { flex: 1; display: flex; align-items: flex-end; gap: 2px; width: 100%; }
  .bar {
    flex: 1; border-radius: 3px 3px 0 0;
    transition: opacity 0.2s;
    min-height: 4px;
  }
  .bar:hover { opacity: 0.8; }
  .bar-in { background: var(--accent2); }
  .bar-out { background: var(--accent); }
  .bar-label { font-size: 10px; color: var(--muted); }

  /* ── TABLE ── */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th {
    text-align: left; padding: 10px 16px;
    font-size: 11px; font-weight: 600;
    color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
  }
  .data-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid rgba(35,38,58,0.5); vertical-align: middle; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: rgba(108,99,255,0.05); }

  /* ── BADGES ── */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600;
  }
  .badge-green { background: rgba(0,229,160,0.15); color: var(--accent2); }
  .badge-yellow { background: rgba(255,209,102,0.15); color: var(--accent4); }
  .badge-red { background: rgba(255,107,107,0.15); color: var(--accent3); }
  .badge-blue { background: rgba(108,99,255,0.15); color: var(--accent); }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #5a52e0; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(108,99,255,0.4); }
  .btn-success { background: var(--accent2); color: #0a0b0f; }
  .btn-success:hover { opacity: 0.9; }
  .btn-ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: rgba(255,107,107,0.15); color: var(--accent3); border: 1px solid rgba(255,107,107,0.3); }
  .btn-danger:hover { background: var(--accent3); color: #fff; }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-icon { padding: 7px; border-radius: 7px; background: var(--surface2); border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; font-size: 14px; }
  .btn-icon:hover { background: var(--border); }

  /* ── FORM ── */
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
  .form-input {
    width: 100%; padding: 10px 14px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--text);
    font-size: 14px; font-family: 'DM Sans', sans-serif;
    transition: border-color 0.2s;
    outline: none;
  }
  .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(108,99,255,0.15); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    z-index: 200;
    animation: fadeIn 0.2s ease;
  }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    width: 560px; max-width: 95vw;
    max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.25s ease;
  }
  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 17px; }
  .modal-body { padding: 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; gap: 10px; justify-content: flex-end; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  /* ── LOGIN ── */
  .login-page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    position: relative; overflow: hidden;
  }
  .login-bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 50%, rgba(108,99,255,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 60% 60% at 80% 50%, rgba(0,229,160,0.08) 0%, transparent 60%);
  }
  .login-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 48px;
    width: 420px;
    position: relative; z-index: 1;
    box-shadow: 0 24px 80px rgba(0,0,0,0.5);
  }
  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 36px; }
  .login-logo-icon {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
  }
  .login-logo-text { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 22px; }
  .login-logo-sub { font-size: 12px; color: var(--muted); }
  .login-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 26px; margin-bottom: 8px; }
  .login-sub { font-size: 14px; color: var(--muted); margin-bottom: 32px; }
  .login-btn { width: 100%; padding: 13px; font-size: 15px; justify-content: center; border-radius: 10px; }
  .login-hint { text-align: center; margin-top: 16px; font-size: 12px; color: var(--muted); }

  /* ── SEARCH BAR ── */
  .search-row { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
  .search-input-wrap { flex: 1; min-width: 200px; position: relative; }
  .search-input { width: 100%; padding: 10px 14px 10px 36px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; }
  .search-input:focus { border-color: var(--accent); }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--muted); }
  .filter-select { padding: 9px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-size: 13px; font-family: inherit; outline: none; cursor: pointer; }

  /* ── ACTIVITY FEED ── */
  .activity-item { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(35,38,58,0.5); }
  .activity-item:last-child { border-bottom: none; }
  .activity-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
  .dot-in { background: var(--accent2); }
  .dot-out { background: var(--accent); }
  .dot-order { background: var(--accent4); }
  .dot-admin { background: #a78bfa; }
  .dot-alert { background: var(--accent3); }
  .activity-main { flex: 1; }
  .activity-action { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
  .activity-meta { font-size: 11px; color: var(--muted); }
  .activity-time { font-size: 11px; color: var(--muted); white-space: nowrap; }

  /* ── DONUT ── */
  .donut-legend { display: flex; flex-direction: column; gap: 10px; }
  .legend-item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .legend-val { margin-left: auto; font-weight: 600; }

  /* ── REPORT ── */
  .report-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(35,38,58,0.5); }
  .report-row:last-child { border-bottom: none; }
  .progress-bar-wrap { width: 80px; height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .progress-bar-fill { height: 100%; border-radius: 3px; }

  /* ── TABS ── */
  .tabs { display: flex; gap: 4px; padding: 4px; background: var(--surface2); border-radius: var(--radius-sm); margin-bottom: 20px; width: fit-content; }
  .tab { padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--muted); transition: all 0.2s; }
  .tab.active { background: var(--surface); color: var(--text); box-shadow: var(--shadow); }

  /* ── PAGINATION ── */
  .pagination { display: flex; align-items: center; gap: 6px; justify-content: flex-end; margin-top: 16px; }
  .page-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .page-btn:hover, .page-btn.active { background: var(--accent); border-color: var(--accent); }
  .page-info { font-size: 12px; color: var(--muted); margin-right: 8px; }

  /* ── TOOLTIP ── */
  .tooltip-wrap { position: relative; }
  .tooltip-wrap:hover .tooltip { opacity: 1; transform: translateY(0); }
  .tooltip { position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%) translateY(4px); background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 4px 8px; font-size: 11px; white-space: nowrap; opacity: 0; pointer-events: none; transition: all 0.15s; z-index: 100; }

  /* ── ANIMATIONS ── */
  .fade-in { animation: fadeIn 0.4s ease; }

  /* ── STOCK MOVEMENT MODAL ── */
  .stock-type-btn { flex: 1; padding: 10px; border-radius: 8px; border: 2px solid var(--border); background: transparent; color: var(--muted); font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
  .stock-type-btn.active-in { border-color: var(--accent2); color: var(--accent2); background: rgba(0,229,160,0.1); }
  .stock-type-btn.active-out { border-color: var(--accent3); color: var(--accent3); background: rgba(255,107,107,0.1); }

  @media (max-width: 1024px) {
    .kpi-grid { grid-template-columns: repeat(2,1fr); }
    .grid-3-1 { grid-template-columns: 1fr; }
  }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat().format(n);
const fmtCurrency = (n) => "$" + new Intl.NumberFormat().format(n);

function StatusBadge({ status }) {
  const map = { "In Stock": "badge-green", "Low Stock": "badge-yellow", "Critical": "badge-red", "Active": "badge-green", "Inactive": "badge-red", "Admin": "badge-blue", "Manager": "badge-blue", "Staff": "badge-yellow", "Viewer": "badge-green" };
  return <span className={`badge ${map[status] || "badge-blue"}`}>{status}</span>;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@inventrackk.com");
  const [pass, setPass] = useState("password");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleLogin = () => {
    setErr("");
    if (!email || !pass) { setErr("Please fill all fields."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ name: "John Smith", role: "Admin" }); }, 1200);
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card fade-in">
        <div className="login-logo">
          <div className="login-logo-icon">📦</div>
          <div>
            <div className="login-logo-text">InvenTrack</div>
            <div className="login-logo-sub">Inventory Management</div>
          </div>
        </div>
        <div className="login-title">Welcome back 👋</div>
        <div className="login-sub">Sign in to manage your inventory</div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input className="form-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
        </div>
        {err && <div style={{ color: "var(--accent3)", fontSize: 13, marginBottom: 12 }}>{err}</div>}

        <button className="btn btn-primary login-btn" onClick={handleLogin} disabled={loading}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
        <div className="login-hint">Demo: any email + any password</div>
      </div>
    </div>
  );
}

function Sidebar({ page, setPage, user, onLogout }) {
  const nav = [
    { key: "dashboard", icon: "🏠", label: "Dashboard" },
    { key: "inventory", icon: "📦", label: "Inventory", badge: 3 },
    { key: "orders", icon: "🛒", label: "Orders" },
    { key: "suppliers", icon: "🏭", label: "Suppliers" },
    { key: "reports", icon: "📊", label: "Reports" },
    { key: "admin", icon: "⚙️", label: "Admin Panel" },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-icon">📦</div>
        <div>
          <div className="logo-text">InvenTrack</div>
          <div className="logo-sub">Management Suite</div>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Main Menu</div>
        {nav.map(n => (
          <div key={n.key} className={`nav-item ${page === n.key ? "active" : ""}`} onClick={() => setPage(n.key)}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
            {n.badge && <span className="nav-badge">{n.badge}</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">JS</div>
          <div className="user-info">
            <div className="user-info-name">{user?.name}</div>
            <div className="user-info-role">{user?.role}</div>
          </div>
        </div>
        <div className="nav-item" onClick={onLogout} style={{ color: "var(--accent3)", marginTop: 4 }}>
          <span className="nav-icon">🚪</span> Logout
        </div>
      </div>
    </div>
  );
}

function Topbar({ title, page }) {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-search">🔍 Quick search...</div>
      <div className="icon-btn notif-dot">🔔</div>
      <div className="icon-btn">👤</div>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────────────────────
const chartData = [
  { label: "Jan", in: 80, out: 45 }, { label: "Feb", in: 95, out: 62 }, { label: "Mar", in: 70, out: 50 },
  { label: "Apr", in: 110, out: 80 }, { label: "May", in: 85, out: 55 }, { label: "Jun", in: 120, out: 90 },
  { label: "Jul", in: 100, out: 70 }, { label: "Aug", in: 130, out: 88 },
];
const maxVal = Math.max(...chartData.map(d => d.in));

function Dashboard() {
  const kpis = [
    { icon: "📦", value: "12,540", label: "Total Stock Units", trend: "+8.2%", up: true, color: "var(--accent)" },
    { icon: "⚠️", value: "23", label: "Low Stock Alerts", trend: "+3 today", up: false, color: "var(--accent3)" },
    { icon: "🛒", value: "148", label: "Orders Today", trend: "+12.5%", up: true, color: "var(--accent2)" },
    { icon: "💰", value: "$84,200", label: "Revenue MTD", trend: "+6.1%", up: true, color: "var(--accent4)" },
  ];

  return (
    <div className="page-content fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Good Morning, John! 👋</div>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Wednesday, February 25, 2026 · Here's what's happening today</div>
      </div>

      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div className="kpi-card" key={i} style={{ "--kpi-color": k.color }}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-trend ${k.up ? "trend-up" : "trend-down"}`}>
              {k.up ? "↑" : "↓"} {k.trend} vs last period
            </div>
          </div>
        ))}
      </div>

      <div className="grid-3-1">
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">📈 Stock Movement — 2026</span>
            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--muted)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent2)", display: "inline-block" }} />Stock In</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)", display: "inline-block" }} />Stock Out</span>
            </div>
          </div>
          <div className="panel-body">
            <div className="chart-bars">
              {chartData.map((d, i) => (
                <div className="bar-group" key={i}>
                  <div className="bar-wrap">
                    <div className="bar bar-in" style={{ height: `${(d.in / maxVal) * 100}%` }} title={`In: ${d.in}`} />
                    <div className="bar bar-out" style={{ height: `${(d.out / maxVal) * 100}%` }} title={`Out: ${d.out}`} />
                  </div>
                  <div className="bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><span className="panel-title">🔴 Low Stock Alerts</span></div>
          <div className="panel-body" style={{ padding: "12px 20px" }}>
            {MOCK_PRODUCTS.filter(p => p.status !== "In Stock").map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(35,38,58,0.5)" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>SKU: {p.sku}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: p.status === "Critical" ? "var(--accent3)" : "var(--accent4)" }}>{p.qty} units</div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-header"><span className="panel-title">📋 Recent Activity</span></div>
        <div className="panel-body" style={{ padding: "8px 20px" }}>
          {MOCK_ACTIVITY.map(a => (
            <div className="activity-item" key={a.id}>
              <div className={`activity-dot dot-${a.type}`} />
              <div className="activity-main">
                <div className="activity-action">{a.action}</div>
                <div className="activity-meta">{a.item} · by {a.user}</div>
              </div>
              <div className="activity-time">{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────
function InventoryPage() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [stockItem, setStockItem] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "Electronics", supplier: "", qty: "", price: "", reorder: 20, warehouse: "Warehouse A" });
  const [stockForm, setStockForm] = useState({ type: "in", qty: "", note: "" });

  const categories = ["All", ...new Set(MOCK_PRODUCTS.map(p => p.category))];
  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (catFilter === "All" || p.category === catFilter) &&
      (statusFilter === "All" || p.status === statusFilter) &&
      (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  });

  const openAdd = () => { setEditItem(null); setForm({ name: "", sku: "", category: "Electronics", supplier: "", qty: "", price: "", reorder: 20, warehouse: "Warehouse A" }); setShowModal(true); };
  const openEdit = (p) => { setEditItem(p); setForm({ ...p }); setShowModal(true); };
  const openStock = (p) => { setStockItem(p); setStockForm({ type: "in", qty: "", note: "" }); setShowStockModal(true); };

  const saveProduct = () => {
    const qty = parseInt(form.qty) || 0;
    const status = qty <= 0 ? "Critical" : qty <= form.reorder ? "Low Stock" : "In Stock";
    if (editItem) {
      setProducts(ps => ps.map(p => p.id === editItem.id ? { ...p, ...form, qty, status } : p));
    } else {
      setProducts(ps => [...ps, { ...form, id: Date.now(), qty, status }]);
    }
    setShowModal(false);
  };

  const deleteProduct = (id) => setProducts(ps => ps.filter(p => p.id !== id));

  const saveStock = () => {
    const delta = parseInt(stockForm.qty) || 0;
    setProducts(ps => ps.map(p => {
      if (p.id !== stockItem.id) return p;
      const newQty = stockForm.type === "in" ? p.qty + delta : Math.max(0, p.qty - delta);
      const status = newQty <= 0 ? "Critical" : newQty <= p.reorder ? "Low Stock" : "In Stock";
      return { ...p, qty: newQty, status };
    }));
    setShowStockModal(false);
  };

  return (
    <div className="page-content fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800 }}>Inventory Management</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{fmt(filtered.length)} products found</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm">📥 Import</button>
          <button className="btn btn-ghost btn-sm">📤 Export</button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      <div className="search-row">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {["All", "In Stock", "Low Stock", "Critical"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th><th>SKU</th><th>Category</th><th>Qty</th><th>Price</th><th>Warehouse</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>No products found</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{p.sku}</td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td>
                  <span style={{ fontWeight: 700, color: p.status === "Critical" ? "var(--accent3)" : p.status === "Low Stock" ? "var(--accent4)" : "var(--accent2)" }}>
                    {fmt(p.qty)}
                  </span>
                </td>
                <td>{fmtCurrency(p.price)}</td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>{p.warehouse}</td>
                <td><StatusBadge status={p.status} /></td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-icon" onClick={() => openStock(p)} title="Stock In/Out">↕️</button>
                    <button className="btn-icon" onClick={() => openEdit(p)} title="Edit">✏️</button>
                    <button className="btn-icon" onClick={() => deleteProduct(p.id)} title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Showing {filtered.length} of {products.length} products</span>
          <div className="pagination">
            {[1, 2, 3, "...", 10].map((p, i) => <button key={i} className={`page-btn ${p === 1 ? "active" : ""}`}>{p}</button>)}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editItem ? "✏️ Edit Product" : "➕ Add New Product"}</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. MacBook Pro" />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input className="form-input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. MBP-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {["Electronics", "Accessories", "Cables", "Furniture", "Other"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <input className="form-input" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Supplier name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price ($)</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Reorder Point</label>
                  <input className="form-input" type="number" value={form.reorder} onChange={e => setForm(f => ({ ...f, reorder: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Warehouse</label>
                  <select className="form-input" value={form.warehouse} onChange={e => setForm(f => ({ ...f, warehouse: e.target.value }))}>
                    {["Warehouse A", "Warehouse B", "Warehouse C"].map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveProduct}>{editItem ? "Save Changes" : "Add Product"}</button>
            </div>
          </div>
        </div>
      )}

      {showStockModal && stockItem && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowStockModal(false)}>
          <div className="modal" style={{ width: 400 }}>
            <div className="modal-header">
              <div className="modal-title">↕️ Stock Movement</div>
              <button className="btn-icon" onClick={() => setShowStockModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: "12px 16px", background: "var(--surface2)", borderRadius: 10, marginBottom: 16, border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700 }}>{stockItem.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Current stock: <strong style={{ color: "var(--text)" }}>{fmt(stockItem.qty)} units</strong></div>
              </div>
              <div className="form-group">
                <label className="form-label">Movement Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className={`stock-type-btn ${stockForm.type === "in" ? "active-in" : ""}`} onClick={() => setStockForm(f => ({ ...f, type: "in" }))}>📥 Stock IN</button>
                  <button className={`stock-type-btn ${stockForm.type === "out" ? "active-out" : ""}`} onClick={() => setStockForm(f => ({ ...f, type: "out" }))}>📤 Stock OUT</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="form-input" type="number" value={stockForm.qty} onChange={e => setStockForm(f => ({ ...f, qty: e.target.value }))} placeholder="Enter quantity" />
              </div>
              <div className="form-group">
                <label className="form-label">Reference / Note</label>
                <input className="form-input" value={stockForm.note} onChange={e => setStockForm(f => ({ ...f, note: e.target.value }))} placeholder="PO number or reason" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowStockModal(false)}>Cancel</button>
              <button className={`btn ${stockForm.type === "in" ? "btn-success" : "btn-danger"}`} onClick={saveStock}>
                {stockForm.type === "in" ? "📥 Add Stock" : "📤 Remove Stock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ADMIN ─────────────────────────────────────────────────────────────────────
function AdminPage() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState(MOCK_USERS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Staff", status: "Active" });

  const saveUser = () => {
    setUsers(u => [...u, { ...form, id: Date.now(), joined: new Date().toISOString().split("T")[0] }]);
    setShowModal(false);
    setForm({ name: "", email: "", role: "Staff", status: "Active" });
  };

  const roles = [
    { name: "Admin", desc: "Full access to all features", color: "var(--accent)", perms: ["All features", "User management", "System settings", "Reports"] },
    { name: "Manager", desc: "Manage inventory & reports", color: "var(--accent2)", perms: ["Inventory CRUD", "View reports", "Stock movements", "Supplier mgmt"] },
    { name: "Staff", desc: "Day-to-day operations", color: "var(--accent4)", perms: ["View inventory", "Stock IN/OUT", "View orders"] },
    { name: "Viewer", desc: "Read-only access", color: "var(--muted)", perms: ["View inventory", "View reports"] },
  ];

  const logs = [
    { user: "John Smith", action: "Updated product MacBook Pro", time: "5 min ago", type: "edit" },
    { user: "Jane Doe", action: "Added stock: iPhone 14 (+50)", time: "22 min ago", type: "stock" },
    { user: "Bob Wilson", action: "Login attempt failed", time: "1 hr ago", type: "auth" },
    { user: "Alice Brown", action: "Viewed Inventory Report", time: "2 hr ago", type: "view" },
    { user: "John Smith", action: "Changed Bob Wilson role → Staff", time: "3 hr ago", type: "admin" },
  ];

  return (
    <div className="page-content fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800 }}>Admin Panel</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Manage users, roles, and system settings</div>
        </div>
      </div>

      <div className="tabs">
        {[["users", "👥 Users"], ["roles", "🔑 Roles"], ["logs", "📝 Audit Logs"], ["settings", "⚙️ Settings"]].map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {tab === "users" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
          </div>
          <div className="panel">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>
                          {u.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 13 }}>{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td><StatusBadge status={u.status} /></td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{u.joined}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn-icon">✏️</button>
                        <button className="btn-icon" onClick={() => setUsers(us => us.filter(x => x.id !== u.id))}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "roles" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
          {roles.map(r => (
            <div className="panel" key={r.name} style={{ borderLeft: `3px solid ${r.color}` }}>
              <div className="panel-body">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16 }}>{r.name}</div>
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>{r.desc}</div>
                <div>
                  {r.perms.map(p => <div key={p} style={{ fontSize: 12, color: "var(--text)", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}><span style={{ color: "var(--accent2)" }}>✓</span>{p}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <div className="panel">
          <div className="panel-body" style={{ padding: "8px 20px" }}>
            {logs.map((l, i) => (
              <div className="activity-item" key={i}>
                <div className="activity-dot" style={{ background: l.type === "auth" ? "var(--accent3)" : l.type === "admin" ? "var(--accent)" : "var(--accent2)", marginTop: 5 }} />
                <div className="activity-main">
                  <div className="activity-action">{l.action}</div>
                  <div className="activity-meta">by {l.user}</div>
                </div>
                <div className="activity-time">{l.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[["Company Info", [["Company Name", "Acme Corp"], ["Industry", "Technology"], ["Country", "United States"]]], ["System Preferences", [["Currency", "USD ($)"], ["Date Format", "MM/DD/YYYY"], ["Timezone", "UTC-5 (EST)"]]]].map(([title, fields]) => (
            <div className="panel" key={title}>
              <div className="panel-header"><span className="panel-title">{title}</span></div>
              <div className="panel-body">
                {fields.map(([l, v]) => (
                  <div className="form-group" key={l}>
                    <label className="form-label">{l}</label>
                    <input className="form-input" defaultValue={v} />
                  </div>
                ))}
                <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}>Save Changes</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ width: 440 }}>
            <div className="modal-header">
              <div className="modal-title">👤 Add New User</div>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {[["Full Name", "name", "text", "John Smith"], ["Email Address", "email", "email", "john@company.com"]].map(([l, k, t, p]) => (
                <div className="form-group" key={k}>
                  <label className="form-label">{l}</label>
                  <input className="form-input" type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={p} />
                </div>
              ))}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {["Admin", "Manager", "Staff", "Viewer"].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {["Active", "Inactive"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveUser}>Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── REPORTS ───────────────────────────────────────────────────────────────────
function ReportsPage() {
  const [tab, setTab] = useState("valuation");
  const totalValue = MOCK_PRODUCTS.reduce((s, p) => s + p.qty * p.price, 0);

  const catValues = MOCK_PRODUCTS.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.qty * p.price;
    return acc;
  }, {});

  const catColors = { Electronics: "var(--accent)", Accessories: "var(--accent2)", Cables: "var(--accent4)", Furniture: "#a78bfa", Other: "var(--muted)" };

  const topProducts = [...MOCK_PRODUCTS].sort((a, b) => b.qty * b.price - a.qty * a.price).slice(0, 5);
  const reorderItems = MOCK_PRODUCTS.filter(p => p.status !== "In Stock");

  return (
    <div className="page-content fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800 }}>Reports & Analytics</div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Data-driven insights for smarter decisions</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm">📅 Feb 2026</button>
          <button className="btn btn-primary btn-sm">📤 Export PDF</button>
        </div>
      </div>

      <div className="tabs">
        {[["valuation", "📊 Valuation"], ["movement", "📉 Movement"], ["reorder", "🔁 Reorder"], ["top", "🏆 Top Products"]].map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {tab === "valuation" && (
        <div className="grid-2">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">💰 Total Inventory Value</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "var(--accent2)" }}>{fmtCurrency(totalValue)}</span>
            </div>
            <div className="panel-body">
              <div className="donut-legend">
                {Object.entries(catValues).map(([cat, val]) => (
                  <div className="legend-item" key={cat}>
                    <div className="legend-dot" style={{ background: catColors[cat] }} />
                    <span style={{ fontSize: 13 }}>{cat}</span>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${(val / totalValue * 100)}%`, background: catColors[cat] }} />
                    </div>
                    <span className="legend-val">{Math.round(val / totalValue * 100)}%</span>
                    <span style={{ color: "var(--muted)", fontSize: 12, minWidth: 80, textAlign: "right" }}>{fmtCurrency(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><span className="panel-title">📦 Stock by Category</span></div>
            <div className="panel-body">
              {Object.entries(catValues).map(([cat, val]) => (
                <div className="report-row" key={cat}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{cat}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {MOCK_PRODUCTS.filter(p => p.category === cat).reduce((s, p) => s + p.qty, 0)} units
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: catColors[cat] }}>{fmtCurrency(val)}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{Math.round(val / totalValue * 100)}% of total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "movement" && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">📉 Stock Movement — Last 8 Months</span></div>
          <div className="panel-body">
            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
              {[["Total IN", "↑ 790 units", "var(--accent2)"], ["Total OUT", "↓ 540 units", "var(--accent3)"], ["Net Change", "+250 units", "var(--accent)"]].map(([l, v, c]) => (
                <div key={l} style={{ flex: 1, padding: 16, background: "var(--surface2)", borderRadius: 10, borderLeft: `3px solid ${c}` }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{l}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: c }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="chart-bars" style={{ height: 160 }}>
              {chartData.map((d, i) => (
                <div className="bar-group" key={i}>
                  <div className="bar-wrap">
                    <div className="bar bar-in" style={{ height: `${(d.in / maxVal) * 100}%` }} />
                    <div className="bar bar-out" style={{ height: `${(d.out / maxVal) * 100}%` }} />
                  </div>
                  <div className="bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "reorder" && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">⚠️ Items Requiring Reorder</span>
            <button className="btn btn-primary btn-sm">📧 Send Reorder Emails</button>
          </div>
          <table className="data-table">
            <thead><tr><th>Product</th><th>SKU</th><th>Current Qty</th><th>Reorder Point</th><th>Shortage</th><th>Supplier</th><th>Action</th></tr></thead>
            <tbody>
              {reorderItems.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{p.sku}</td>
                  <td><span style={{ color: "var(--accent3)", fontWeight: 700 }}>{p.qty}</span></td>
                  <td>{p.reorder}</td>
                  <td><span style={{ color: "var(--accent3)", fontWeight: 700 }}>-{p.reorder - p.qty}</span></td>
                  <td style={{ fontSize: 12 }}>{p.supplier}</td>
                  <td><button className="btn btn-primary btn-sm">Order Now</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "top" && (
        <div className="panel">
          <div className="panel-header"><span className="panel-title">🏆 Top Products by Value</span></div>
          <div className="panel-body">
            {topProducts.map((p, i) => {
              const val = p.qty * p.price;
              const maxV = topProducts[0].qty * topProducts[0].price;
              return (
                <div className="report-row" key={p.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "var(--accent4)" : "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 13 }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.sku} · {fmt(p.qty)} units @ {fmtCurrency(p.price)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 120, height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${val / maxV * 100}%`, height: "100%", background: "var(--accent)", borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14 }}>{fmtCurrency(val)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PLACEHOLDER PAGES ─────────────────────────────────────────────────────────
function PlaceholderPage({ title, icon }) {
  return (
    <div className="page-content fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ textAlign: "center", color: "var(--muted)" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14 }}>This module is ready to be extended</div>
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  const PAGE_TITLES = {
    dashboard: "Dashboard",
    inventory: "Inventory",
    orders: "Orders",
    suppliers: "Suppliers",
    reports: "Reports",
    admin: "Admin Panel",
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "inventory": return <InventoryPage />;
      case "admin": return <AdminPage />;
      case "reports": return <ReportsPage />;
      case "orders": return <PlaceholderPage title="Orders" icon="🛒" />;
      case "suppliers": return <PlaceholderPage title="Suppliers" icon="🏭" />;
      default: return <Dashboard />;
    }
  };

  if (!user) return (
    <>
      <style>{css}</style>
      <LoginPage onLogin={setUser} />
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app-layout">
        <Sidebar page={page} setPage={setPage} user={user} onLogout={() => setUser(null)} />
        <div className="main">
          <Topbar title={PAGE_TITLES[page]} />
          {renderPage()}
        </div>
      </div>
    </>
  );
}
