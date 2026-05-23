import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  Download,
  Map,
  RefreshCcw,
  Settings,
  SlidersHorizontal,
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
    <div className="app-shell">
      <header className="topbar">
        <button className="top-brand" type="button" onClick={() => onNavigate("dashboard")}>
          <img className="brand-mark" src="/brand/logo-mark.svg" alt="" aria-hidden="true" />
          <span className="top-brand-copy">
            <p className="brand-title">RouteLab Group 1</p>
            <p className="brand-subtitle">Shortest Path Lab</p>
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
          <button className="secondary-button" type="button" onClick={onExportJson}>
            <Upload size={17} />
            Tải dữ liệu
          </button>
          <button className="solid-button" type="button" onClick={onExportPng}>
            <Download size={17} />
            Xuất kết quả
          </button>
          <span className="action-divider" aria-hidden="true" />
          <button className="icon-button" type="button" onClick={onReset} aria-label="Reset kết quả">
            <RefreshCcw size={20} />
          </button>
          <button className="icon-button" type="button" aria-label="Cài đặt">
            <Settings size={21} />
          </button>
          <button className="icon-button" type="button" aria-label="Trợ giúp">
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </header>

      <div className="workspace">
        <main className={`main-content ${isNavigating ? "is-navigating" : ""}`}>{children}</main>
      </div>
    </div>
  );
}
