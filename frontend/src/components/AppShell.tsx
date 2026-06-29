import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  Download,
  Map,
  RefreshCcw,
  Table2,
  Upload,
} from "lucide-react";
import type { ViewKey } from "../App";

type AppShellProps = {
  activeView: ViewKey;
  isNavigating: boolean;
  children: ReactNode;
  onNavigate: (view: ViewKey) => void;
  onReset: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
};

const navItems: Array<{ key: ViewKey; label: string; icon: typeof Map }> = [
  { key: "dashboard", label: "Dashboard", icon: Map },
  { key: "data", label: "Dữ liệu", icon: Table2 },
  { key: "report", label: "Báo cáo", icon: BarChart3 },
  { key: "guide", label: "Hướng dẫn", icon: BookOpen },
];

export function AppShell({
  activeView,
  isNavigating,
  children,
  onNavigate,
  onReset,
  onExportJson,
  onExportPng,
}: AppShellProps) {
  return (
    <div className="app-shell routelab-shell">
      <header className="topbar routelab-topbar">
        <button className="top-brand" type="button" onClick={() => onNavigate("dashboard")}>
          <svg className="brand-mark-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="5" r="2" />
            <circle cx="5" cy="19" r="2" />
            <circle cx="19" cy="19" r="2" />
            <path d="M12 7L5 17M12 7l7 10M5 19l14 0" />
          </svg>
          <span className="top-brand-copy">
            <p className="brand-title">
              Route<span className="brand-accent">Lab</span>
            </p>
          </span>
        </button>

        <nav className="top-nav" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`top-nav-link ${activeView === item.key ? "active" : ""}`}
              type="button"
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button className="icon-button" type="button" onClick={onExportJson} aria-label="Xuất JSON" title="Xuất JSON">
            <Upload size={18} />
          </button>
          <button className="icon-button" type="button" onClick={onExportPng} aria-label="Xuất PNG" title="Xuất PNG">
            <Download size={18} />
          </button>
          <span className="action-divider" aria-hidden="true" />
          <button className="icon-button" type="button" onClick={onReset} aria-label="Reset kết quả" title="Reset">
            <RefreshCcw size={18} />
          </button>
          <span className="run-badge">· thuật toán đường đi</span>
        </div>
      </header>

      <div className="workspace">
        <main className={`main-content ${isNavigating ? "is-navigating" : ""}`}>{children}</main>
      </div>
    </div>
  );
}
