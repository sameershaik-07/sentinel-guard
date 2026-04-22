"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Home, History, Cpu, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/",         label: "Dashboard",   icon: Home     },
  { href: "/history",  label: "Scan History", icon: History  },
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
      className="relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 group"
      style={{
        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
        background: isActive ? "var(--bg-elevated)" : "transparent",
      }}
    >
      {/* Soft bottom accent bar */}
      {isActive && (
        <span
          className="absolute bottom-0 left-1/4 right-1/4 h-1 rounded-t-md"
          style={{ background: "var(--cyan-400)" }}
        />
      )}

      <Icon
        className="w-4 h-4 shrink-0 transition-colors duration-200"
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

  return (
    <>
      {/* ── Desktop/Tablet Topbar ───────────────────────────── */}
      <header className="sidebar-texture w-full flex items-center justify-between px-6 py-3 z-50 sticky top-0" style={{
        background: "linear-gradient(90deg, rgba(6,12,26,0.98) 0%, rgba(3,6,15,0.99) 100%)",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div className="flex items-center gap-8">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(99,102,241,0.20) 100%)",
                border: "1px solid rgba(6,182,212,0.30)",
                boxShadow: "var(--glow-cyan-sm)",
              }}
            >
              <Shield className="w-5 h-5" style={{ color: "var(--cyan-400)" }} />
            </div>
            <h1
              className="text-lg font-extrabold tracking-tight hidden sm:block"
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

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-2" role="navigation" aria-label="Main navigation">
            {navLinks.map(({ href, label, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} isActive={pathname === href} />
            ))}
          </nav>
        </div>

        {/* Right Section / Status Badge */}
        <div className="flex items-center gap-4">
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.18)",
            }}
          >
            <Cpu className="w-3.5 h-3.5" style={{ color: "var(--green-400)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--green-400)" }}>
              Engine Ready
            </span>
            <span className="relative flex h-2 w-2 shrink-0 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--green-400)" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--green-500)" }} />
            </span>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              boxShadow: "var(--glow-cyan-sm)",
            }}
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer Overlay ───────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-60 md:hidden"
            style={{ background: "rgba(1,3,10,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside
            className="fixed top-0 right-0 h-full w-64 z-70 flex flex-col md:hidden animate-fade-in-up"
            style={{
              background: "linear-gradient(180deg, rgba(6,12,26,0.99) 0%, rgba(3,6,15,0.99) 100%)",
              borderLeft: "1px solid var(--border-subtle)",
              overflow: "hidden",
            }}
          >
            <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Navigation</span>
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.04)" }}
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navLinks.map(({ href, label, icon }) => (
                <NavLink
                  key={href}
                  href={href}
                  label={label}
                  icon={icon}
                  isActive={pathname === href}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}