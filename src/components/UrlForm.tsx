"use client";

import { useState } from "react";
import { Search, Loader2, Zap } from "lucide-react";

// Validate URL before scanning
function isValidUrl(raw: string): boolean {
  try {
    const prefixed = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const u = new URL(prefixed);
    return u.hostname.includes(".") && u.hostname.length > 3;
  } catch {
    return false;
  }
}

export default function UrlForm({ onScanStart, onScanComplete, onError }: any) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [scanSteps, setScanSteps] = useState<string[]>([]);
  const [showLiveFeed, setShowLiveFeed] = useState(true);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (urlError) setUrlError(null); // Clear error on edit
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (!isValidUrl(url)) {
      setUrlError("Please enter a valid URL, e.g. https://example.com");
      return;
    }
    setUrlError(null);

    setLoading(true);
    setShowLiveFeed(true); // Always show when a new scan starts
    setScanStatus("Connecting to Scanner Engine...");
    setScanSteps(["[INIT] Establishing secure scanning link..."]);
    onScanStart();

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    try {
      const ws = new WebSocket("ws://localhost:8000/ws/scan");

      ws.onopen = () => {
        ws.send(JSON.stringify({ target_url: targetUrl }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "info") {
          setScanStatus(data.status);
          setScanSteps(prev => [...prev, `[INFO] ${data.status}`]);
        } else if (data.type === "result") {
          setScanSteps(prev => [...prev, `[DONE] Scan completed successfully.`]);
          setTimeout(() => {
            onScanComplete(data.data);
            setLoading(false);
            setScanStatus("");
            ws.close();
            // REMOVED setScanSteps([]) so the feed STAYS VISIBLE until next scan
          }, 600); // Small delay to read the final step
        } else if (data.type === "error") {
          onError(data.message);
          setLoading(false);
          setScanStatus("");
          ws.close();
        }
      };

      ws.onerror = (error) => {
        onError("WebSocket error occurred.");
        setLoading(false);
        setScanStatus("");
        ws.close();
      };
      
    } catch (err: any) {
      onError(err.message || "An unknown error occurred.");
      setLoading(false);
      setScanStatus("");
    }
  };
  // ─────────────────────────────────────────────────────────────

  return (
    /*
     * Step 4.1 — Glassmorphism card wrapper.
     * Step 4.3 — When loading, add form-scan-border class for the
     *            rotating conic-gradient border effect.
     */
    <div
      className={`glass-card p-6 mb-8 ${loading ? "form-scan-border" : ""}`}
      style={{
        /* Inner top-highlight — gives the "glass edge" illusion */
        boxShadow: loading
          ? undefined            /* scan-border handles its own shadow */
          : "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* Label row */}
        <div className="flex items-center justify-between mb-4">
          <label
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Target URL
          </label>
        </div>

        {/* Input + Button row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">

          {/* Step 4.2 — Input with animated focus ring (.url-input) */}
          <div className="relative flex-1">
            {/* Leading icon */}
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search
                className="h-4 w-4 transition-colors duration-200"
                style={{ color: loading ? "var(--cyan-400)" : "var(--text-muted)" }}
              />
            </span>

            <input
              id="target-url-input"
              type="text"
              value={url}
              onChange={handleUrlChange}
              disabled={loading}
              aria-describedby={urlError ? "url-error" : undefined}
              required
              className="url-input"
              placeholder="https://example.com"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Step 4.4 — Gradient shimmer button */}
          <button
            id="run-audit-btn"
            type="submit"
            disabled={loading}
            className="btn-gradient"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Audit
              </>
            )}
          </button>
        </div>

        {/* Inline URL validation error */}
        {urlError && (
          <p id="url-error" className="text-xs mt-2 flex items-center gap-1.5" style={{ color: "var(--red-400)" }} role="alert">
            <span>⚠</span> {urlError}
          </p>
        )}

        {/* Live Terminal Streaming Toggle/Header */}
        {scanSteps.length > 0 && (
          <div className="flex items-center justify-between mb-2 transition-opacity duration-300 z-10 relative">
            <button
              type="button"
              onClick={() => setShowLiveFeed(!showLiveFeed)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold font-mono transition-all"
              style={{
                color: showLiveFeed ? "var(--cyan-400)" : "var(--text-muted)",
                background: showLiveFeed ? "rgba(6,182,212,0.08)" : "transparent",
                border: "1px solid",
                borderColor: showLiveFeed ? "rgba(6,182,212,0.25)" : "transparent",
              }}
            >
              <span style={{ fontFamily: "monospace" }}>{showLiveFeed ? "[-]" : "[+]"}</span>
              {showLiveFeed ? "Hide Live Feed" : "Show Live Feed"}
            </button>
            {/* Aria-live for scan status */}
            {scanStatus && (
              <span aria-live="polite" className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                {scanStatus}
              </span>
            )}
          </div>
        )}

        {/* Live Terminal Streaming UI */}
        <div
          className="transition-all duration-500 ease-in-out origin-top"
          style={{ 
            height: (showLiveFeed && scanSteps.length > 0) ? "160px" : "0px", 
            opacity: (showLiveFeed && scanSteps.length > 0) ? 1 : 0, 
            overflow: "hidden" 
          }}
        >
          <div className="h-full rounded-xl bg-black border border-slate-700 shadow-xl overflow-hidden flex flex-col font-mono text-xs">
            {/* macOS styled terminal header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              </div>
              <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Sentinel Engine Feed</span>
              <div className="w-12"></div> {/* Spacer for center alignment */}
            </div>
            
            {/* Terminal Body */}
            <div className="p-4 overflow-y-auto scrollbar-styled flex-1 select-text">
              <div className="flex flex-col gap-2 relative">
                {scanSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-3 text-slate-300 text-sm opacity-95 animate-fade-in-up font-mono">
                    <span className="text-emerald-500 select-none">➜</span>
                    <span>{step}</span>
                  </div>
                ))}
                {/* Blinking cursor at the end */}
                {loading && scanSteps.length > 0 && (
                  <div className="flex gap-3 text-slate-300 text-sm font-mono ml-1">
                    <span className="text-emerald-500 select-none">➜</span>
                    <span
                      className="inline-block w-2 h-[1em] bg-emerald-400 align-middle"
                      style={{ animation: "blink-cursor 1s step-end infinite" }}
                    />
                  </div>
                )}
              </div>
              <div ref={(el) => el?.scrollIntoView()} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}