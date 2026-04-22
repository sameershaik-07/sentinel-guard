"use client";

import { useEffect, useRef, useState } from "react";
import {
  Terminal,
  ShieldAlert,
  Info,
  AlertTriangle,
  ShieldCheck,
  ArrowUp,
} from "lucide-react";
import { apiUrl } from "@/lib/runtime-config";

// ── Types ─────────────────────────────────────────────────────────────────
type LogType = "info" | "warn" | "critical" | "secure";

type LogEntry = {
  id: number;
  type: LogType;
  time: string;
  message: string;
};

// ── Per-type visual config (Step 7.2) ─────────────────────────────────────
const LOG_CONFIG: Record<LogType, {
  borderColor: string;
  iconColor: string;
  labelColor: string;
  label: string;
  icon: React.ReactNode;
}> = {
  info: {
    borderColor: "var(--cyan-500)",
    iconColor: "var(--cyan-400)",
    labelColor: "var(--cyan-400)",
    label: "INFO",
    icon: <Info className="w-3.5 h-3.5" />,
  },
  warn: {
    borderColor: "var(--yellow-400)",
    iconColor: "var(--yellow-400)",
    labelColor: "var(--yellow-400)",
    label: "WARN",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  critical: {
    borderColor: "var(--red-500)",
    iconColor: "var(--red-400)",
    labelColor: "var(--red-400)",
    label: "CRIT",
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
  },
  secure: {
    borderColor: "var(--green-500)",
    iconColor: "var(--green-400)",
    labelColor: "var(--green-400)",
    label: "SAFE",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
};

// ─────────────────────────────────────────────────────────────────────────
export default function SimulatedLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [newestId, setNewestId] = useState<number | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  // Step 7.4 — ref for the scrollable log list
  const scrollRef = useRef<HTMLDivElement>(null);

  // Periodic Cosmos DB Log Fetch
  useEffect(() => {
    
    const fetchLogs = async () => {
      // Skip fetching if tab is hidden — saves network requests
      if (document.visibilityState === "hidden") return;

      try {
        const res = await fetch(apiUrl("/api/logs"));
        if (res.ok) {
          setIsError(false);
          const data = await res.json();
          if (data.logs && data.logs.length > 0) {
            setIsConnecting(false);
            setLogs((prev) => {
              const existingIds = new Set(prev.map(p => p.id.toString()));
              const newEntries = data.logs.filter((l: LogEntry) => !existingIds.has(l.id.toString()));
              
              if (newEntries.length > 0) {
                setNewestId(newEntries[0].id);
                const merged = [...newEntries, ...prev].slice(0, 50);
                
                // Auto-scroll to top only if user is already near the top
                if (scrollRef.current && scrollRef.current.scrollTop < 80) {
                  scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
                } else if (scrollRef.current && scrollRef.current.scrollTop > 80) {
                  setShowJump(true);
                }
                
                return merged;
              }
              return prev;
            });
          } else {
            setIsConnecting(false);
          }
        } else {
          setIsError(true);
          setIsConnecting(false);
        }
      } catch (err) {
        console.error("Cosmos DB Live Feed connection error", err);
        setIsError(true);
        setIsConnecting(false);
      }
    };

    fetchLogs(); // Run immediately

    // Every 5s check for new Azure Cosmos DB events
    const internalInterval = setInterval(fetchLogs, 5000);

    return () => clearInterval(internalInterval);
  }, []);

  // Step 7.4 — Track whether user has scrolled away from top
  const handleScroll = () => {
    if (scrollRef.current) {
      setShowJump(scrollRef.current.scrollTop > 72);
    }
  };

  const jumpToLatest = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <h3
          className="flex items-center gap-2 text-sm font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          <Terminal className="w-4 h-4" style={{ color: "var(--cyan-400)" }} />
          Live Sentinel Fleet Logs
        </h3>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
              style={{ background: "var(--green-400)" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: "var(--green-500)" }}
            />
          </span>
          <span
            className="text-xs font-mono uppercase tracking-widest"
            style={{ color: "var(--green-400)" }}
          >
            Live
          </span>
        </div>
      </div>

      {/* ── Scrollable log list ─────────────────────────────── */}
      {/* Step 7.1 — terminal-panel gives true-black bg */}
      <div className="relative flex-1 min-h-0">
        {/* Step 7.1 — CRT scanline overlay (pointer-events:none, z-index 10) */}
        <div className="terminal-scanlines" aria-hidden="true" />

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="terminal-panel h-full overflow-y-auto scrollbar-styled p-3 space-y-2 font-mono text-xs"
          style={{ position: "relative", zIndex: 1 }}
        >
          {logs.length === 0 ? (
            /* Empty / Error / Connecting state */
            <div className="flex flex-col items-center justify-center h-full gap-4 py-10 px-6 text-center">
              {isError ? (
                <>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    <ShieldAlert className="w-5 h-5" style={{ color: "var(--red-400)" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--red-400)" }}>Backend Unreachable</p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Start the API server to see live events.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative w-10 h-10 shrink-0">
                    <span className="animate-ping absolute inset-0 rounded-full" style={{ background: "rgba(6,182,212,0.15)" }} />
                    <Terminal className="w-5 h-5 absolute inset-0 m-auto" style={{ color: "var(--cyan-400)" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {isConnecting ? "Connecting to Sentinel…" : "Waiting for events"}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Events will appear here as they occur.</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            logs.map((log) => {
              const cfg = LOG_CONFIG[log.type];
              const isNewest = log.id === newestId;

              return (
                <div
                  key={log.id}
                  /* Step 7.2 — colored left border only, clean bg */
                  /* Step 7.3 — typewriter class on newest entry     */
                  className={`log-entry ${isNewest ? "log-typing" : ""}`}
                  style={{ borderLeft: `3px solid ${cfg.borderColor}` }}
                >
                  {/* Top row: type badge + timestamp */}
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: cfg.iconColor }}>{cfg.icon}</span>
                    <span
                      className="font-bold text-xs tracking-widest uppercase"
                      style={{ color: cfg.labelColor }}
                    >
                      {cfg.label}
                    </span>
                    <span
                      className="ml-auto tabular-nums"
                      style={{ color: "var(--text-disabled)", fontSize: "0.68rem" }}
                    >
                      [{log.time}]
                    </span>
                  </div>

                  {/* Message */}
                  <p
                    className="leading-snug pl-5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {log.message}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Step 7.4 — Jump to Latest button */}
      {showJump && (
        <div
          className="flex justify-center py-2 shrink-0"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <button onClick={jumpToLatest} className="btn-jump-latest">
            <ArrowUp className="w-3 h-3" />
            Jump to Latest
          </button>
        </div>
      )}
    </div>
  );
}
