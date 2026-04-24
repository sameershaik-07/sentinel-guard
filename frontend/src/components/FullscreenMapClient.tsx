"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AttackMap from "./AttackMap";
import { apiUrl } from "../lib/runtime-config";

export default function FullscreenMapClient() {
  const searchParams = useSearchParams();
  const scanId = searchParams?.get("scan_id") || searchParams?.get("id");

  const [chart, setChart] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) {
      setError("Missing scan_id query parameter.");
      setLoading(false);
      return;
    }

    const fetchScan = async () => {
      try {
        const res = await fetch(apiUrl(`/api/scan/${scanId}`));
        if (!res.ok) throw new Error(`Failed to fetch scan: ${res.status}`);
        const data = await res.json();
        setChart(data?.mermaid_syntax || "");
      } catch (err: any) {
        setError(err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    void fetchScan();
  }, [scanId]);

  if (loading) return <div className="p-8">Loading fullscreen map…</div>;
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>;

  return (
    <div className="w-full h-screen bg-[#01030a] p-6">
      <div className="max-w-full h-full">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-lg font-bold">Visual Attack Map — Fullscreen</h1>
          <div className="flex items-center gap-2">
            <a
              href={apiUrl(`/api/report/${scanId}`)}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded bg-cyan-600 text-white text-sm font-semibold"
            >
              Download Report (PDF)
            </a>
          </div>
        </div>

        <div className="h-[calc(100vh-96px)]">
          <AttackMap chart={chart} />
        </div>
      </div>
    </div>
  );
}
