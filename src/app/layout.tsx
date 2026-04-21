import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { Mail } from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sentinel-Guard | Cloud Auditor",
  description: "One-click cloud security auditing platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} app-bg flex h-screen overflow-hidden font-sans antialiased`}>
        {/* Layer 1 — radial glow blooms (fixed, behind everything) */}
        <div className="app-glow-layer" aria-hidden="true" />
        {/* Layer 2 — dot-grid pattern (fixed, above glow) */}
        <div className="app-grid-layer" aria-hidden="true" />

        <Sidebar />
        <main className="flex-1 overflow-y-auto scrollbar-styled relative flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <footer className="w-full py-5 flex flex-col items-center justify-center gap-3 text-[10px] font-semibold tracking-[0.2em] mt-auto uppercase" style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)" }}>
            <div>Built by Sameer • Sentinel-Guard</div>
            <div className="flex items-center gap-4">
              <a href="https://www.linkedin.com/in/shaiksameer999/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[var(--cyan-400)] transition-colors">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3.5 h-3.5 fill-current" stroke="currentColor" strokeWidth="0">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
                <span>shaiksameer999</span>
              </a>
              <a href="mailto:sameer.004shaik@gmail.com" className="flex items-center gap-1.5 hover:text-[var(--cyan-400)] transition-colors">
                <Mail className="w-4 h-4" />
                <span>Contact</span>
              </a>
            </div>
          </footer>
        </main>
      </body>
    </html>
  );
}
