"use client";

import { useEffect, useState } from "react";
import { Clock, Download, ShieldAlert, Globe, Activity, Loader2, ArrowRight } from "lucide-react";

interface ScanHistory {
  id: string; // The database id is usually a string UUID
  target_url: string;
  score: string;
  score_percentage: number;
  vulnerabilities: any[];
  timestamp: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/history");
      if (!res.ok) throw new Error("Failed to fetch scan history");
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownloadPDF = async (scanId: string, url: string) => {
    try {
      setDownloadingId(scanId);
      const res = await fetch(`http://localhost:8000/api/report/${scanId}`);
      if (!res.ok) throw new Error("Report generation failed");
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const formattedUrl = url.replace("https://", "").replace("http://", "");
      a.download = `Sentinel_Report_${formattedUrl}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    } catch (e) {
      console.error(e);
      alert("Failed to download the PDF report.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto" style={{ background: "var(--bg-main)" }}>
      {/* Header Section */}
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 md:mb-4"
            style={{
              background: "linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
        >
          Scan History & Intelligence
        </h1>
        <p className="text-sm md:text-base max-w-2xl leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          A complete record of your past attack surface evaluations and autonomous vulnerability assessments. Download comprehensive executive PDF reports directly from the archives.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 opacity-70">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: "var(--cyan-400)" }} />
          <p className="text-sm uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>
            Decrypting Archives...
          </p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center p-10 rounded-xl" style={{ border: "1px dashed var(--red-900)", background: "rgba(220,38,38,0.05)" }}>
          <div className="text-center">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--red-500)" }} />
            <p style={{ color: "var(--red-400)" }}>{error}</p>
            <button 
              onClick={fetchHistory}
              className="mt-4 px-4 py-2 rounded-lg text-sm transition-colors border"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)", background: "var(--bg-elevated)" }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 rounded-2xl text-center" style={{ border: "1px dashed var(--border-subtle)", background: "var(--bg-surface)" }}>
          <Activity className="w-12 h-12 mb-4 opacity-50" style={{ color: "var(--text-muted)" }} />
          <h3 className="text-lg font-bold mb-2">No Records Found</h3>
          <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
            Your history archive is empty. Initiate a new scan from the Dashboard to begin tracking your attack surface.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {history.map((scan) => {
            // Determine score color matching your globals.css and UI logic
            const scoreColor = ["A", "B"].includes(scan.score) 
              ? "var(--green-500)" 
              : scan.score === "C" 
              ? "var(--yellow-500)" 
              : "var(--red-500)";
            
            const badgeBg = ["A", "B"].includes(scan.score) 
              ? "rgba(34,197,94,0.15)"
              : scan.score === "C" 
              ? "rgba(234,179,8,0.15)"
              : "rgba(239,68,68,0.15)";
              
            const dateObj = new Date(scan.timestamp);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

            const isDownloading = downloadingId === scan.id;

            return (
              <div 
                key={scan.id} 
                className="flex flex-col md:flex-row items-center rounded-2xl transition-all duration-300 group overflow-hidden"
                style={{ 
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "0 8px 24px -10px rgba(0,0,0,0.4)"
                }}
              >
                {/* Score Grade Box */}
                <div 
                  className="flex flex-col items-center justify-center py-6 px-8 md:min-h-full border-b md:border-b-0 md:border-r"
                  style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg"
                    style={{ background: badgeBg, color: scoreColor, border: `1px solid ${scoreColor}40` }}
                  >
                    {scan.score}
                  </div>
                  <span className="mt-3 text-xs font-bold uppercase tracking-wider" style={{ color: scoreColor }}>
                    {scan.score_percentage}% Score
                  </span>
                </div>

                {/* Details Section */}
                <div className="flex-1 p-6 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2" style={{ color: "var(--cyan-400)" }}>
                      <Globe className="w-4 h-4" />
                      <span className="font-semibold truncate max-w-[200px] md:max-w-xs">{scan.target_url}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                      <Clock className="w-3 h-3" />
                      {dateStr}
                    </div>
                  </div>

                  {/* High level metrics */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Vulnerabilities</span>
                      <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{scan.vulnerabilities?.length || 0}</span>
                    </div>
                    <div className="w-px" style={{ background: "var(--border-subtle)" }} />
                    <div className="flex flex-col">
                      <span className="text-xs uppercase font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Time</span>
                      <span className="text-sm font-medium mt-1" style={{ color: "var(--text-primary)" }}>{timeStr}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-auto">
                    <button
                      onClick={() => handleDownloadPDF(scan.id, scan.target_url)}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                      style={{ 
                        background: "var(--bg-elevated)", 
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" style={{ color: "var(--cyan-400)" }} />
                          <span className="group-hover:text-cyan-400 transition-colors">Executive PDF</span>
                        </>
                      )}
                    </button>

                    <button 
                      className="p-2.5 rounded-lg transition-colors flex items-center gap-2 group/btn"
                      style={{ color: "var(--text-muted)" }}
                      onClick={() => alert('Detailed view navigation would happen here')}
                      title="View Details"
                    >
                      <span className="text-xs font-medium uppercase tracking-wide opacity-0 group-hover/btn:opacity-100 transition-opacity translate-x-2 group-hover/btn:translate-x-0">Details</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:text-white transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
