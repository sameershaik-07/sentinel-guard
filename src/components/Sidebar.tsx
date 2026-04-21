"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Home, History, Settings, Cpu, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/",         label: "Dashboard",   icon: Home     },
  { href: "/history",  label: "Scan History", icon: History  },
  { href: "/settings", label: "Settings",     icon: Settings },
];

function NavLink({ href, label, icon: Icon, isActive, onClick }: {
  href: string; label: string; icon: React.ElementType; isActive: boolean; onClick?: () => void;
}) {
  return (
    <Link
      key={href}
      href={href}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group"
      style={{
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        background: isActive ? "var(--bg-elevated)" : "transparent",
      }}
    >
      {/* Soft left accent bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md"
          style={{ background: "var(--cyan-400)" }}
        />
      )}

      <Icon
        className="w-4 h-4 flex-shrink-0 transition-colors duration-200"
        style={{ color: isActive ? "var(--cyan-400)" : "var(--text-muted)" }}
      />
      <span className="text-sm font-medium">{label}</span>

      {/* Hover background (inactive only) */}
      {!isActive && (
        <span
          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "rgba(255,255,255,0.04)" }}
        />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <>
      {/* Branding */}
      <div className="p-6 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(99,102,241,0.20) 100%)",
            border: "1px solid rgba(6,182,212,0.30)",
            boxShadow: "var(--glow-cyan-sm)",
          }}
        >
          <Shield className="w-5 h-5" style={{ color: "var(--cyan-400)" }} />
        </div>

        <h1
          className="text-lg font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(135deg, var(--cyan-300) 0%, #a78bfa 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Sentinel-Guard
        </h1>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-6 space-y-2" role="navigation" aria-label="Main navigation">
        {navLinks.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            isActive={pathname === href}
            onClick={onLinkClick}
          />
        ))}
      </nav>

      {/* Status badge + version */}
      <div className="p-5 mt-auto" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
          style={{
            background: "rgba(34,197,94,0.07)",
            border: "1px solid rgba(34,197,94,0.18)",
          }}
        >
          <Cpu className="w-4 h-4" style={{ color: "var(--green-400)" }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "var(--green-400)" }}>
              Scanner Engine
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Online &amp; Ready
            </p>
          </div>
          {/* Animated ping dot */}
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: "var(--green-400)" }} />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--green-500)" }} />
          </span>
        </div>

        <p className="text-center text-xs" style={{ color: "var(--text-disabled)" }}>
          v1.0.0 &nbsp;·&nbsp; Sentinel-Guard
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className="sidebar-texture w-64 h-screen flex-col hidden md:flex" style={{
        background: "linear-gradient(180deg, rgba(6,12,26,0.98) 0%, rgba(3,6,15,0.99) 100%)",
        borderRight: "1px solid var(--border-subtle)",
        position: "relative",
        overflow: "hidden",
      }}>
        {NavContent({})}
      </aside>

      {/* ── Mobile Hamburger Button ─────────────────────────── */}
      <button
        className="fixed top-4 left-4 z-50 flex md:hidden items-center justify-center w-9 h-9 rounded-xl"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          color: "var(--text-secondary)",
          boxShadow: "var(--glow-cyan-sm)",
        }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* ── Mobile Drawer Overlay ───────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(1,3,10,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="sidebar-texture fixed left-0 top-0 h-full w-72 z-50 flex flex-col md:hidden animate-fade-in-up"
            style={{
              background: "linear-gradient(180deg, rgba(6,12,26,0.99) 0%, rgba(3,6,15,0.99) 100%)",
              borderRight: "1px solid var(--border-subtle)",
              overflow: "hidden",
            }}
            aria-label="Mobile navigation"
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)" }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
            {NavContent({ onLinkClick: () => setMobileOpen(false) })}
          </aside>
        </>
      )}
    </>
  );
}