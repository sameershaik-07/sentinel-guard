"use client";

import { useState } from "react";
import { AlertTriangle, Download } from "lucide-react";
import UrlForm           from "@/components/UrlForm";
import ScoreCard         from "@/components/ScoreCard";
import VulnerabilityList from "@/components/VulnerabilityList";
import ReactAttackMap    from "@/components/ReactAttackMap";
import AttackMap         from "@/components/AttackMap";
import SimulatedLogs     from "@/components/SimulatedLogs";
import TopProgressBar    from "@/components/TopProgressBar";
import TargetIntelligence from "@/components/TargetIntelligence";

export default function Home() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [attackMapMode, setAttackMapMode] = useState<"interactive" | "topology">("interactive");

  const handleScanStart    = ()       => { setError(null); setScanResult(null); setIsScanning(true);  };
  const handleScanComplete = (d: any) => { setScanResult(d); setIsScanning(false); };
  const handleError        = (e: string) => { setError(e);  setIsScanning(false); };

  return (
    <div className="min-h-screen p-8 lg:p-12 space-y-10 max-w-screen-2xl mx-auto">

      {/* Step 9.3 — GitHub-style top progress bar */}
      <TopProgressBar isScanning={isScanning} />

      {/* ── Header ─────────────────────────────────────────── */}
      <header>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-5" style={{ color: "var(--text-muted)" }}>
          <span>Home</span>
          <span style={{ color: "var(--border-strong)" }}>/</span>
          <span style={{ color: "var(--cyan-400)" }}>Dashboard</span>
        </div>

        {/* Animated gradient title + icon */}
        <div className="flex items-center gap-4 mb-3">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(139,92,246,0.14) 100%)",
              border: "1px solid rgba(6,182,212,0.25)",
              boxShadow: "var(--glow-cyan-sm)",
            }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: "var(--cyan-400)" }} />
          </div>
          <div>
            <h1 className="glow-text text-3xl font-extrabold tracking-tight leading-none">
              Security Audit Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Scan your web applications for vulnerabilities in seconds.
            </p>
          </div>
        </div>

        {/* Status badges — reactive to scan data when available */}
        <div className="flex flex-wrap gap-3 mt-5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
            {scanResult ? "Vulnerabilities" : "Threats Blocked"}{" "}
            <span className="font-bold ml-0.5 text-rose-300">
              {scanResult ? scanResult.vulnerabilities?.length ?? 0 : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Security Score{" "}
            <span className="font-bold ml-0.5 text-emerald-300">
              {scanResult ? `${scanResult.score} (${scanResult.score_percentage}/100)` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
            Last Scan{" "}
            <span className="font-bold ml-0.5 text-sky-300">
              {scanResult ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
            </span>
          </div>
        </div>

        {/* Glowing divider */}
        <div className="relative mt-7">
          <div className="absolute inset-0 top-px h-px w-full" style={{
            background: "linear-gradient(90deg, transparent 0%, var(--cyan-500) 30%, var(--border-strong) 70%, transparent 100%)",
            opacity: 0.4, filter: "blur(0.5px)",
          }} />
          <hr style={{ borderColor: "var(--border-subtle)", opacity: 0.5 }} />
        </div>
      </header>

      {/* URL Input Form */}
      <UrlForm onScanStart={handleScanStart} onScanComplete={handleScanComplete} onError={handleError} />

      {/* Error banner */}
      {error && (
        <div className="glass-card p-4 flex items-center gap-3"
          style={{ borderColor: "rgba(239,68,68,0.35)", color: "var(--red-400)" }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Scan result target label and download button */}
      {scanResult && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Audit results for:{" "}
            <span className="font-semibold font-mono" style={{ color: "var(--cyan-400)" }}>
              {scanResult.target_url}
            </span>
          </p>

          {/* Step 3.3 — Frontend Download Button */}
          {scanResult.id && (
            <a
              href={`http://localhost:8000/api/report/${scanResult.id}`}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 w-fit animate-fade-in-up"
            >
              <Download className="w-4 h-4" />
              Download Executive Report
            </a>
          )}
        </div>
      )}

      {/* ── Top grid: ScoreCard + AttackMap ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ScoreCard */}
        {scanResult ? (
          <div className="col-span-1 flex flex-col gap-6 animate-fade-in-up">
            <ScoreCard
              score={scanResult.score}
              percentage={scanResult.score_percentage}
              vulnerabilities={scanResult.vulnerabilities}
            />
            {scanResult.recon_data && (
              <TargetIntelligence data={scanResult.recon_data} />
            )}
          </div>
        ) : isScanning ? (
          /* Step 9.1 — Branded shimmer skeleton for ScoreCard */
          <div className="col-span-1 glass-card p-6 flex flex-col items-center justify-center gap-5" style={{ minHeight: "20rem" }}>
            {/* Circular ring shimmer */}
            <div className="relative w-36 h-36 flex-shrink-0">
              <div className="shimmer-bar w-full h-full rounded-full" style={{ height: "144px" }} />
              <div
                className="absolute inset-3 rounded-full flex flex-col items-center justify-center gap-2"
                style={{ background: "var(--bg-surface)" }}
              >
                <div className="shimmer-bar w-10 h-10 rounded-full" />
              </div>
            </div>
            <div className="space-y-3 w-full px-4">
              <div className="shimmer-bar h-4 w-1/2 mx-auto rounded-full" />
              <div className="shimmer-bar h-3 w-1/3 mx-auto rounded-full" />
            </div>
            <p className="text-xs font-mono animate-pulse" style={{ color: "var(--cyan-400)" }}>
              Calculating score…
            </p>
          </div>
        ) : (
          /* Step 9.2 — Empty state: ScoreCard */
          <div
            className="col-span-1 glass-card p-6 flex flex-col items-center justify-center text-center gap-4"
            style={{ minHeight: "20rem" }}
          >
            {/* CSS-art shield illustration */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.18)" }}
              />
              <svg viewBox="0 0 40 44" width="28" height="32" fill="none" aria-hidden="true">
                <path d="M20 2L4 9v12c0 9 7 16.9 16 19 9-2.1 16-10 16-19V9L20 2z"
                  stroke="var(--cyan-500)" strokeWidth="2" fill="rgba(6,182,212,0.10)" strokeLinejoin="round" />
                <path d="M13 22l5 5 9-10" stroke="var(--cyan-400)" strokeWidth="2.2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Security Score
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Enter a URL above and run an audit to see your security grade.
              </p>
            </div>
          </div>
        )}

        {/* AttackMap */}
        {scanResult ? (
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-sm font-semibold tracking-wider text-slate-300">Attack Surface</h2>
              <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 shadow-sm">
                <button 
                  onClick={() => setAttackMapMode("interactive")} 
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === 'interactive' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Interactive Flow
                </button>
                <button 
                  onClick={() => setAttackMapMode("topology")} 
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${attackMapMode === 'topology' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`}
                >
                  Topology Grid
                </button>
              </div>
            </div>
            
            <div className="-mt-6">
              {attackMapMode === "interactive" ? (
                <ReactAttackMap graphData={scanResult.graph_data} />
              ) : (
                <div className="mt-8"> {/* Give it the same spacing as ReactAttackMap */}
                  <AttackMap chart={scanResult.mermaid_syntax} />
                </div>
              )}
            </div>
          </div>
        ) : isScanning ? (
          /* Step 9.1 — Branded shimmer skeleton for AttackMap */
          <div
            className="col-span-1 lg:col-span-2 glass-card p-6 relative overflow-hidden flex flex-col gap-5 items-center justify-center"
            style={{ minHeight: "20rem" }}
          >
            {/* Shimmer bars mimicking a graph */}
            <div className="w-full space-y-4 px-4 opacity-60">
              <div className="flex items-center gap-4">
                <div className="shimmer-bar w-10 h-10 rounded-full flex-shrink-0" />
                <div className="shimmer-bar h-3 flex-1 rounded-full" />
              </div>
              <div className="flex items-center gap-4 pl-12">
                <div className="shimmer-bar h-px w-8 flex-shrink-0" style={{ background: "var(--border-default)" }} />
                <div className="shimmer-bar w-8 h-8 rounded-full flex-shrink-0" />
                <div className="shimmer-bar h-3 flex-1 rounded-full" />
              </div>
              <div className="flex items-center gap-4 pl-12">
                <div className="shimmer-bar h-px w-8 flex-shrink-0" style={{ background: "var(--border-default)" }} />
                <div className="shimmer-bar w-8 h-8 rounded-full flex-shrink-0" />
                <div className="shimmer-bar h-3 w-1/2 rounded-full" />
              </div>
            </div>
            {/* Floating status chip */}
            <div
              className="px-5 py-2.5 rounded-full flex items-center gap-3"
              style={{
                background: "rgba(3,6,15,0.85)",
                border: "1px solid rgba(6,182,212,0.35)",
                boxShadow: "var(--glow-cyan-sm)",
              }}
            >
              <span className="w-2 h-2 rounded-full animate-ping inline-block" style={{ background: "var(--cyan-400)" }} />
              <span className="text-xs font-mono" style={{ color: "var(--cyan-400)" }}>
                Building attack topology…
              </span>
            </div>
          </div>
        ) : (
          /* Step 9.2 — Empty state: AttackMap */
          <div
            className="col-span-1 lg:col-span-2 glass-card p-6 flex flex-col items-center justify-center text-center gap-4"
            style={{ minHeight: "20rem" }}
          >
            {/* CSS-art network node illustration */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}
              />
              <svg viewBox="0 0 48 48" width="36" height="36" fill="none" aria-hidden="true">
                {/* Central node */}
                <circle cx="24" cy="24" r="5" fill="rgba(6,182,212,0.20)" stroke="var(--cyan-500)" strokeWidth="1.5" />
                {/* Satellite nodes */}
                <circle cx="10" cy="12" r="3.5" fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="1.5" />
                <circle cx="38" cy="12" r="3.5" fill="rgba(239,68,68,0.15)"  stroke="var(--red-500)"  strokeWidth="1.5" />
                <circle cx="10" cy="36" r="3.5" fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth="1.5" />
                <circle cx="38" cy="36" r="3.5" fill="rgba(239,68,68,0.15)"  stroke="var(--red-500)"  strokeWidth="1.5" />
                {/* Edges */}
                <line x1="24" y1="24" x2="10" y2="12" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="24" y1="24" x2="38" y2="12" stroke="var(--red-500)"       strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.5" />
                <line x1="24" y1="24" x2="10" y2="36" stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="24" y1="24" x2="38" y2="36" stroke="var(--red-500)"       strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                Visual Attack Map
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Run a scan to generate an interactive threat topology graph.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Lower section: Vulnerabilities + Logs ───────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        <div className="xl:col-span-2">
          {scanResult && (
            <VulnerabilityList 
              vulnerabilities={scanResult.vulnerabilities} 
              ai_remediation={scanResult.ai_remediation} 
            />
          )}

          {/* Step 9.1 — Branded shimmer skeletons for VulnerabilityList */}
          {isScanning && (
            <div className="space-y-4 mt-8">
              {[{ w1: "w-1/3", w2: "w-3/4" }, { w1: "w-1/4", w2: "w-2/3" }].map((widths, i) => (
                <div
                  key={i}
                  className="glass-card p-5 flex items-center gap-5"
                  style={{ borderLeft: "4px solid var(--border-default)" }}
                >
                  <div className="shimmer-bar w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className={`shimmer-bar h-4 ${widths.w1} rounded-full`} />
                    <div className={`shimmer-bar h-3 ${widths.w2} rounded-full`} />
                  </div>
                  <div className="shimmer-bar w-14 h-6 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Sentinel Logs */}
        <div className="xl:col-span-1 h-[600px]">
          <SimulatedLogs />
        </div>
      </div>
    </div>
  );
}
