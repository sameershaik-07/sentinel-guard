"use client";

import { useEffect, useState } from "react";

interface Props {
  isScanning: boolean;
}

export default function TopProgressBar({ isScanning }: Props) {
  const [width, setWidth]     = useState(0);
  const [visible, setVisible] = useState(false);
  const [done, setDone]       = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    if (isScanning) {
      // Reset & show, then slide to 90% over ~25s
      setDone(false);
      setWidth(0);
      setVisible(true);
      // Two-tick delay so the 0-width renders before the transition kicks in
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setWidth(90))
      );
      return () => cancelAnimationFrame(raf);
    } else if (visible) {
      // Snap to 100%, then fade out
      setDone(true);
      setWidth(100);
      hideTimer = setTimeout(() => {
        setVisible(false);
        setWidth(0);
        setDone(false);
      }, 650);
    }

    return () => clearTimeout(hideTimer);
  }, [isScanning]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2.5px",
        zIndex: 9999,
        background: "var(--border-subtle)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background:
            "linear-gradient(90deg, var(--cyan-600), var(--cyan-400), var(--cyan-300))",
          boxShadow: "var(--glow-cyan-sm)",
          /* Slow ease for 0→90, instant for 90→100 */
          transition: done
            ? "width 0.25s ease-in"
            : "width 25s cubic-bezier(0.1, 0.4, 0.2, 1)",
          /* Fade the whole bar out when done */
          opacity: done && width === 100 ? 0 : 1,
          transitionProperty: done ? "width, opacity" : "width",
          transitionDuration: done ? "0.25s, 0.45s" : "25s",
          transitionDelay: done ? "0s, 0.25s" : "0s",
        }}
      />
    </div>
  );
}
