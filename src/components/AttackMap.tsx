"use client";

import React, { useCallback, useEffect, useState } from "react";
import mermaid from "mermaid";
import { Loader2, Maximize2, X } from "lucide-react";

interface Props {
  chart: string;
}

export default function AttackMap({ chart }: Props) {
  const [svg, setSvg] = useState<string>("");
  const [rendering, setRendering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Drill-down Modal State
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Setup a global handler for Mermaid clicks
  useEffect(() => {
    // @ts-ignore
    window.handleMermaidClick = (nodeId: string) => {
      setSelectedNode(nodeId);
    };
    return () => {
      // @ts-ignore
      delete window.handleMermaidClick;
    }
  }, []);

  // ── Step 8.2 — Enhanced mermaid theme ──────────────────────────────────
  const renderChart = useCallback(async () => {
    if (!chart) return;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      themeVariables: {
        // Node fills & borders — bright cyan for visibility on dark bg
        primaryColor:       "#071324",
        primaryTextColor:   "#e2f8ff",
        primaryBorderColor: "#06b6d4",
        nodeBorder:         "#06b6d4",
        mainBkg:            "#071324",
        // Cluster (subgraph) styling
        clusterBkg:         "#040c1a",
        clusterBorder:      "#1e4090",
        // Edge lines — red to signal attack paths
        lineColor:          "#ef4444",
        edgeColor:          "#ef4444",
        // Edge label backgrounds — match surface so they don't float
        edgeLabelBackground: "#071324",
        labelBackground:    "#071324",
        labelTextColor:     "#e2f8ff",
        // Secondary / tertiary nodes
        secondaryColor:     "#0d1f38",
        tertiaryColor:      "#0d1f38",
        // Title + font
        titleColor:         "#38d4f5",
        fontFamily:         "ui-monospace, 'Cascadia Code', monospace",
        fontSize:           "13px",
      },
    });

    setRendering(true);
    try {
      const id = "attack-map-" + Math.random().toString(36).slice(2, 9);
      const { svg: rendered } = await mermaid.render(id, chart);
      setSvg(rendered);
    } catch (e) {
      console.error("Mermaid render error:", e);
      setSvg(
        `<p style="color:var(--red-400);font-family:monospace;font-size:12px">
          Failed to render attack map.
        </p>`
      );
    } finally {
      setRendering(false);
    }
  }, [chart]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
    renderChart();
  }, [renderChart]);

  // Step 8.3 — Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  // ── Shared diagram renderer (used in both card & modal) ────────────────
  const renderDiagramContent = () =>
    rendering ? (
      <div
        className="flex flex-col items-center gap-3"
        style={{ color: "var(--text-muted)" }}
      >
        <Loader2
          className="w-7 h-7 animate-spin"
          style={{ color: "var(--cyan-400)" }}
        />
        <p
          className="text-xs font-mono tracking-wider"
          style={{ color: "var(--cyan-400)" }}
        >
          Generating Threat Topology…
        </p>
      </div>
    ) : (
      <div
        className="w-full h-full flex items-center justify-center overflow-auto scrollbar-styled [&>svg]:max-h-full [&>svg]:max-w-full cursor-pointer transition-transform [&_.node:hover]:opacity-80"
        dangerouslySetInnerHTML={{ __html: svg }}
        onClick={(e: any) => {
          // Fallback parsing just in case Mermaid doesn't trigger the window global natively
          const nodeGrp = e.target.closest('.node');
          if (nodeGrp) {
            const nodeId = nodeGrp.id.replace(/^(flowchart-)?(node-)?|-[0-9]+$/g, '').split('-')[1] || nodeGrp.id;
            setSelectedNode(nodeId);
          }
        }}
      />
    );

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────────── */}
      <div
        className="glass-card rounded-xl relative overflow-hidden flex flex-col h-[500px]"
        style={{
          // Step 8.1 — dot-grid radial pattern as card background
          background: `
            radial-gradient(circle, rgba(6,182,212,0.18) 1px, transparent 1px),
            var(--bg-surface)
          `,
          backgroundSize: "24px 24px, 100% 100%",
          border: "1px solid var(--border-default)",
          minHeight: "20rem",
        }}
      >
        {/* Vignette fade — dots dissolve at the card edges */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 25%, var(--bg-surface) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Card header */}
        <div
          className="relative flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ zIndex: 2, borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Visual Attack Map
          </h3>

          {/* Step 8.3 — Expand button (only shown when diagram is ready) */}
          {svg && !rendering && (
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: "rgba(6,182,212,0.08)",
                border: "1px solid rgba(6,182,212,0.22)",
                color: "var(--cyan-400)",
              }}
              aria-label="Expand attack map to fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Expand
            </button>
          )}
        </div>

        {/* Diagram area */}
        <div
          className="relative flex-1 flex items-center justify-center p-4"
          style={{ zIndex: 2 }}
        >
          {renderDiagramContent()}
        </div>
      </div>

      {/* Step 8.3 — Fullscreen modal overlay ─────────────────────── */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: "rgba(1, 3, 10, 0.97)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Attack map fullscreen view"
        >
          {/* Modal header */}
          <div
            className="flex items-center justify-between px-6 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--cyan-400)" }}
              />
              <h2
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-secondary)" }}
              >
                Visual Attack Map — Fullscreen
              </h2>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.22)",
                color: "var(--red-400)",
              }}
              aria-label="Close fullscreen"
            >
              <X className="w-3.5 h-3.5" />
              Close&nbsp;(Esc)
            </button>
          </div>

          {/* Modal diagram — same dot grid, larger cell size */}
          <div
            className="flex-1 overflow-auto scrollbar-styled flex items-center justify-center p-10 cursor-pointer"
            style={{
              background: `
                radial-gradient(circle, rgba(6,182,212,0.15) 1px, transparent 1px),
                #01030a
              `,
              backgroundSize: "30px 30px, 100% 100%",
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full transition-transform [&_.node:hover]:opacity-80"
              dangerouslySetInnerHTML={{ __html: svg }}
              onClick={(e: any) => {
                const nodeGrp = e.target.closest('.node');
                if (nodeGrp) {
                  const nodeId = nodeGrp.id.replace(/^(flowchart-)?(node-)?|-[0-9]+$/g, '').split('-')[1] || nodeGrp.id;
                  setSelectedNode(nodeId);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Step 4.2 — Interactive Node Drill-down Modal ─────────────────────── */}
      {selectedNode && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background: "rgba(1, 3, 10, 0.8)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="glass-card w-full max-w-md p-6 overflow-hidden relative shadow-[0_0_50px_rgba(6,182,212,0.1)]">
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 p-2 rounded-lg text-cyan-400 hover:bg-cyan-400/10 transition-colors"
            >
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-xl font-bold glow-text mb-2 tracking-wide">
              {selectedNode ? selectedNode.replace(/_/g, " ").toUpperCase() : "Infrastructure Node"}
            </h2>
            <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <p>
                This visual component represents the <strong className="text-cyan-300">{selectedNode}</strong> layer of your audited infrastructure.
              </p>
              
              <div className="p-4 rounded-lg border border-red-500/20 bg-red-900/10 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                <h4 className="font-semibold text-red-400 mb-1">Lateral Movement Risk</h4>
                <p className="text-xs text-red-200/80 leading-relaxed">
                  If compromised, an attacker could pivot from this node to adjoining secure networks or database segments. Ensure firewalls, WAF rules, and role-based access control (RBAC) restrict incoming/outgoing queries directly bound for this subsystem.
                </p>
              </div>

              <div className="pt-2 border-t border-cyan-900/30">
                <h4 className="font-semibold text-cyan-400 mb-1">System Actions</h4>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setSelectedNode(null)} className="flex-1 py-2 text-xs font-semibold rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/60 transition-colors">
                    Close Inspector
                  </button>
                  <button 
                    disabled
                    title="Feature coming soon — please use your WAF/firewall console"
                    className="flex-1 py-2 text-xs font-semibold rounded bg-gradient-to-r from-red-600 to-red-800 text-white opacity-50 cursor-not-allowed shadow-[0_0_15px_rgba(220,38,38,0.2)] select-none"
                    aria-disabled="true"
                  >
                    Quarantine Node
                    <span className="block text-[9px] font-normal opacity-70 mt-0.5">Coming soon</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}