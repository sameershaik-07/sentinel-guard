import { TerminalSquare, Server, Globe, Cpu, Shield, Zap } from "lucide-react";

interface ReconData {
  tech_stack: string[];
  subdomains: string[];
}

// ── Tech category classifier ─────────────────────────────────────────────
function getTechCategory(tech: string): {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
} {
  const t = tech.toLowerCase();
  const isFramework = ["react", "next", "vue", "angular", "svelte", "django", "rails", "laravel", "express", "fastapi", "flask", "nuxt"].some(f => t.includes(f));
  const isCDN       = ["cloudflare", "akamai", "cdn", "fastly", "cloudfront"].some(f => t.includes(f));
  const isServer    = ["nginx", "apache", "iis", "gunicorn", "uwsgi", "node", "tomcat"].some(f => t.includes(f));
  const isSecurity  = ["waf", "modsec", "recaptcha", "ssl", "tls", "jwt", "oauth"].some(f => t.includes(f));

  if (isFramework) return {
    color:  "var(--green-400)",
    bg:     "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.22)",
    icon:   <Zap className="w-3 h-3" />,
  };
  if (isCDN) return {
    color:  "var(--cyan-400)",
    bg:     "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.20)",
    icon:   <Globe className="w-3 h-3" />,
  };
  if (isServer) return {
    color:  "var(--orange-400)",
    bg:     "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.20)",
    icon:   <Server className="w-3 h-3" />,
  };
  if (isSecurity) return {
    color:  "#a78bfa",
    bg:     "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.20)",
    icon:   <Shield className="w-3 h-3" />,
  };
  return {
    color:  "var(--text-secondary)",
    bg:     "var(--bg-elevated)",
    border: "var(--border-subtle)",
    icon:   <Cpu className="w-3 h-3" />,
  };
}

export default function TargetIntelligence({ data }: { data: ReconData }) {
  if (!data) return null;

  return (
    <div
      className="glass-card p-6 flex flex-col rounded-2xl overflow-hidden"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.35)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between mb-6 pb-4"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <h3
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          <TerminalSquare className="w-4 h-4" style={{ color: "var(--cyan-400)" }} />
          Target Intelligence (OSINT)
        </h3>
        <span
          className="text-[10px] font-mono px-2 py-1 rounded font-bold uppercase tracking-widest"
          style={{
            background: "var(--green-dim)",
            color: "var(--green-400)",
            border: "1px solid rgba(34,197,94,0.20)",
          }}
        >
          Passive Scan
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Tech Stack Fingerprinting */}
        <div
          className="p-5 rounded-xl"
          style={{
            background: "rgba(15,23,42,0.50)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Detected Frameworks
            </span>
            <span
              className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {data.tech_stack.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.tech_stack.length > 0 ? (
              data.tech_stack.map((tech, i) => {
                const cat = getTechCategory(tech);
                return (
                  <span
                    key={i}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm"
                    style={{
                      background: cat.bg,
                      color: cat.color,
                      border: `1px solid ${cat.border}`,
                    }}
                    title={tech}
                  >
                    {cat.icon}
                    {tech}
                  </span>
                );
              })
            ) : (
              <span className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                No recognizable frameworks detected.
              </span>
            )}
          </div>
        </div>

        {/* Exposed Subdomains via crt.sh */}
        <div
          className="p-5 rounded-xl"
          style={{
            background: "rgba(15,23,42,0.50)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Exposed Subdomains
            </span>
            <span
              className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {data.subdomains.length}
            </span>
          </div>
          {/* Scrollable subdomain list — max-height prevents overflow on big sets */}
          <div
            className="flex flex-col gap-1.5 scrollbar-styled"
            style={{ maxHeight: "11rem", overflowY: "auto" }}
          >
            {data.subdomains.length > 0 ? (
              data.subdomains.map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs font-mono px-2.5 py-1.5 rounded-lg"
                  style={{
                    color: "var(--text-secondary)",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ color: "var(--text-disabled)" }}>↳</span>
                  <span className="truncate">{sub}</span>
                </div>
              ))
            ) : (
              <span className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                No public subdomains found in CT logs.
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
