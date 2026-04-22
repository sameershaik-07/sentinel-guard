"use client";

import React, { useEffect, useState } from "react";

interface Vulnerability {
  name: string;
  severity: string;
  fix_snippet: string;
}

interface ScoreCardProps {
  score: string;
  percentage: number;
  vulnerabilities?: Vulnerability[];
}

// ── Grade config: color, SVG glow, card bg gradient, label ───────────────
const GRADE_CONFIG: Record<string, {
  color: string;
  glowColor: string;
  gradientFrom: string;
  label: string;
}> = {
  A: {
    color: "#4ade80",
    glowColor: "rgba(74, 222, 128, 0.75)",
    gradientFrom: "rgba(34, 197, 94, 0.13)",
    label: "Excellent — Secure",
  },
  B: {
    color: "#a3e635",
    glowColor: "rgba(163, 230, 53, 0.70)",
    gradientFrom: "rgba(163, 230, 53, 0.10)",
    label: "Good — Minor Issues",
  },
  C: {
    color: "#facc15",
    glowColor: "rgba(250, 204, 21, 0.70)",
    gradientFrom: "rgba(234, 179, 8, 0.11)",
    label: "Fair — Needs Action",
  },
  D: {
    color: "#fb923c",
    glowColor: "rgba(251, 146, 60, 0.75)",
    gradientFrom: "rgba(249, 115, 22, 0.13)",
    label: "Poor — Highly Vulnerable",
  },
  F: {
    color: "#f87171",
    glowColor: "rgba(248, 113, 113, 0.80)",
    gradientFrom: "rgba(239, 68, 68, 0.16)",
    label: "Critical Risk",
  },
};

export default function ScoreCard({
  score,
  percentage,
  vulnerabilities = [],
}: ScoreCardProps) {
  // Step 5.2 — Animated count-up
  const [displayedPct, setDisplayedPct] = useState(0);

  useEffect(() => {
    const end = percentage;
    const duration = 1300;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedPct(Math.round(eased * end));
      if (t < 1) requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percentage]);

  // Step 5.4 — Severity counts
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  vulnerabilities.forEach((v) => {
    if (v.severity in counts) counts[v.severity as keyof typeof counts]++;
  });

  const cfg = GRADE_CONFIG[score] ?? GRADE_CONFIG["F"];

  // SVG ring props
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayedPct / 100) * circumference;

  return (
    <div
      className="col-span-1 rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-lg overflow-hidden"
      style={{
        /* Step 5.3 — Grade-based background gradient */
        background: `
          radial-gradient(ellipse 90% 55% at 50% -10%,
            ${cfg.gradientFrom} 0%,
            var(--bg-surface) 68%),
          var(--bg-surface)
        `,
        border: "1px solid var(--border-default)",
        transition: "background 0.9s ease",
        minHeight: "20rem",
      }}
    >
      <h3
        className="absolute top-5 left-5 text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-muted)", letterSpacing: "0.1em" }}
      >
        Security Score
      </h3>

      {/* Step 5.1 — SVG ring with drop-shadow glow filter */}
      <div className="relative flex items-center justify-center w-40 h-40 mt-6">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 140 140"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={cfg.color} stopOpacity="1" />
              <stop offset="100%" stopColor={cfg.color} stopOpacity="0.6" />
            </linearGradient>
            {/* SVG filter creates the actual glow — more reliable than box-shadow on SVG */}
            <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor={cfg.glowColor}
                floodOpacity="0.3"
              />
            </filter>
          </defs>

          {/* Background track */}
          <circle
            stroke="var(--border-subtle)"
            strokeWidth="11"
            fill="transparent"
            r={radius}
            cx="70"
            cy="70"
          />



          {/* Progress arc with glow */}
          <circle
            stroke={cfg.color}
            strokeWidth="11"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx="70"
            cy="70"
            filter="url(#ring-glow)"
            style={{ transition: "stroke-dashoffset 0.04s linear" }}
          />
        </svg>

        {/* Center: grade letter + animated percentage */}
        <div className="absolute flex flex-col items-center justify-center select-none">
          <span
            className="text-5xl font-black tracking-tight leading-none"
            style={{ color: cfg.color, textShadow: `0 0 16px ${cfg.glowColor}` }}
          >
            {score}
          </span>
          <span
            className="text-xs font-mono mt-1.5 tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            {displayedPct} / 100
          </span>
        </div>
      </div>

      {/* Status label */}
      <div className="mt-5 text-center">
        <p className="text-sm font-semibold" style={{ color: cfg.color }}>
          {cfg.label}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-disabled)" }}>
          Based on OWASP Top-10 checks
        </p>

        {/* Total finding count */}
        {vulnerabilities.length > 0 && (
          <p className="text-xs mt-3 font-semibold" style={{ color: "var(--text-muted)" }}>
            {vulnerabilities.length} finding{vulnerabilities.length !== 1 ? "s" : ""} detected
          </p>
        )}
      </div>
    </div>
  );
}
