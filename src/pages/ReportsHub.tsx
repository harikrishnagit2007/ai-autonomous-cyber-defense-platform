import { useState, useEffect } from "react";
import { FileText, Download, ShieldCheck, Cpu, Loader2, Calendar, FileSpreadsheet } from "lucide-react";
import { Report } from "../types";

interface ReportsHubProps {
  token: string;
}

export default function ReportsHub({ token }: ReportsHubProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to retrieve system compliance reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownload = async (report: Report) => {
    setDownloadingId(report.id);
    try {
      // Direct native browser navigation to stream-download the PDF
      window.open(`/api/reports/download/${report.id}`);
    } catch (err) {
      console.error("Failed to download PDF audit:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Upper Title Banner */}
      <div className="border-b border-slate-800/60 pb-5">
        <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-500" />
          <span>Security & Compliance Reports</span>
        </h1>
        <p className="text-xs text-slate-500">
          Retrieve mathematically verifiable security posture digests, cryptographically signed for SOC-2 or PCI compliance.
        </p>
      </div>

      {/* Grid List of Reports Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports && reports.length > 0 ? (
          reports.map((rep) => {
            const isWeekly = rep.type === "weekly";
            return (
              <div
                key={rep.id}
                className="group rounded-2xl bg-[#0D1117] border border-slate-800/50 p-5 flex flex-col justify-between h-44 hover:border-blue-500/30 transition-all duration-300 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl bg-slate-900 p-2.5 text-blue-400 border border-slate-800">
                      {isWeekly ? <Calendar className="h-5 w-5" /> : <FileSpreadsheet className="h-5 w-5" />}
                    </div>
                    <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest bg-blue-500/5 px-2.5 py-1 rounded border border-blue-500/20 font-semibold">
                      {rep.type} audit
                    </span>
                  </div>

                  <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider mt-3 truncate max-w-[200px]">
                    {rep.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Compiled: {new Date(rep.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-mono text-slate-500">
                    File Size: {rep.size}
                  </span>

                  <button
                    onClick={() => handleDownload(rep)}
                    disabled={downloadingId === rep.id}
                    className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {downloadingId === rep.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    <span>Get PDF</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-800/60 p-12 text-center bg-[#0D1117] shadow-xl col-span-1 md:col-span-2 lg:col-span-3">
            <Cpu className="h-10 w-10 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h3 className="font-display text-xs font-bold text-slate-300 uppercase tracking-wide">
              No Signed Report Archives Available
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
              SOC-2 audit briefings compile automatically on the weekend scan daemon iteration cycles.
            </p>
          </div>
        )}
      </div>

      {/* Verification footer banner */}
      <div className="rounded-2xl bg-blue-500/5 border border-blue-500/15 p-5 max-w-2xl flex items-start gap-3 shadow-md">
        <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs font-sans">
          <p className="font-semibold text-white">Cryptographic Certificate Signature</p>
          <p className="text-slate-400 leading-relaxed mt-1">
            All reports downloaded from this terminal are digitally signed with our SHA256 corporate key sequence. The signature can be validated against the public keyring.
          </p>
        </div>
      </div>

    </div>
  );
}
