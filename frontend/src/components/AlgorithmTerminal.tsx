import { useEffect, useRef, useState } from "react";
import { ChevronDown, Terminal, Trash2 } from "lucide-react";
import type { TerminalLogEntry } from "../types/path";
import { TerminalArtBackground } from "./TerminalArtBackground";

type AlgorithmTerminalProps = {
  logs: TerminalLogEntry[];
  onClear: () => void;
  artMode?: "idle" | "running";
  artColor?: string;
};

export function AlgorithmTerminal({ logs, onClear, artMode = "idle", artColor = "#06b6d4" }: AlgorithmTerminalProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCollapsed && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [isCollapsed, logs]);

  return (
    <section className={`algorithm-terminal ${isCollapsed ? "collapsed" : ""}`} aria-label="Thuật toán terminal">
      {!isCollapsed ? <TerminalArtBackground mode={artMode} color={artColor} /> : null}
      <div className="terminal-head">
        <div>
          <span className="term-dot red" aria-hidden="true" />
          <span className="term-dot yellow" aria-hidden="true" />
          <span className="term-dot green" aria-hidden="true" />
          <Terminal size={16} />
          <span>Algorithm terminal</span>
        </div>
        <div className="terminal-actions">
          <button type="button" onClick={onClear} aria-label="Xóa terminal log">
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-label={isCollapsed ? "Mở terminal" : "Thu gọn terminal"}
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {!isCollapsed ? (
        <div ref={logRef} className="terminal-body">
          {logs.length === 0 ? (
            <p className="terminal-empty">Console cleared.</p>
          ) : (
            logs.map((log) => (
              <p key={log.id} className={`terminal-line ${log.tone}`}>
                <time>{log.timestamp}</time>
                <span>{log.message}</span>
              </p>
            ))
          )}
        </div>
      ) : null}
    </section>
  );
}
