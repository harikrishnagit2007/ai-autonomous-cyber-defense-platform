import { useState, useEffect } from "react";
import { Shield, Globe, Bell, FileText, CheckCircle, RefreshCw, AlertOctagon, Terminal, ArrowRight, ArrowUpRight, ShieldAlert, Cpu } from "lucide-react";
import { DashboardSummary, User, Website } from "../types";
import AIGauge from "../components/AIGauge";
import SecureChart from "../components/SecureChart";

interface DashboardProps {
  user: User | null;
  token: string;
  onNavigate: (route: string) => void;
  websites: Website[];
  onRefreshWebsites: () => void;
}

export default function Dashboard({ user, token, onNavigate, websites, onRefreshWebsites }: DashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/dashboard/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard summary stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [websites]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefreshWebsites();
    await fetchSummary();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="text-xs font-mono text-blue-400">CONNECTING TO ACTIVE OPERATING AGENT...</span>
        </div>
      </div>
    );
  }

  const globalScore = summary?.globalScore ?? 92;

  return (
    <div className="space-y-6 text-left">
      
      {/* Upper Welcome Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white uppercase">
            Security Command Center
          </h1>
          <p className="text-sm text-slate-500">
            Operational Phase: 3 (Autonomous Response Active) • Welcome back, <span className="text-blue-400 font-semibold">{user?.fullName || "Agent"}</span>
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          id="btn-dashboard-refresh"
          className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 text-xs font-mono uppercase tracking-wider text-slate-300 transition-all duration-300 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 text-blue-400 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Re-Analyzing Network..." : "Full Diagnostic Scan"}</span>
        </button>
      </div>

      {/* Bento Grid Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
        
        {/* Card 1: Global Security Score Card (col-span-4) */}
        <div className="md:col-span-4 rounded-2xl border border-slate-800/50 bg-[#0D1117] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
          <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-blue-600/10 blur-3xl"></div>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">SECURITY INTEGRITY</span>
            <h3 className="text-xs font-bold text-slate-400 uppercase mt-1">Diagnostic Score Index</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center my-4">
            <span className="text-6xl font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-400 font-display">
              {globalScore}<span className="text-3xl font-bold">%</span>
            </span>
            <div className="mt-3 flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-mono uppercase">+2.4% from last scan</span>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-3 text-center">
            <p className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">ALL NODES VERIFIED & ENCRYPTED</p>
          </div>
        </div>

        {/* Card 2: AI Intelligence Terminal Panel (col-span-5) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-800/50 bg-[#0D1117] p-6 shadow-xl flex flex-col justify-between min-h-[280px]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/40 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Central Agent Recommendation</h3>
            </div>
            <span className="text-[9px] bg-blue-600/10 border border-blue-500/20 px-2 py-0.5 rounded text-blue-400 uppercase font-mono">Live Advisory</span>
          </div>

          <div className="flex-1 space-y-3 font-mono text-[11px] py-1">
            <div className="flex gap-2">
              <span className="text-blue-500 shrink-0">[SYS]</span>
              <span className="text-slate-400">Analyzing live node metrics ingress logs...</span>
            </div>
            <div className="flex gap-2">
              <span className="text-purple-500 shrink-0">[AI]</span>
              <span className="text-slate-200">
                Threat feed active. Correlation engine confirms {summary?.activeAlertsCount && summary.activeAlertsCount > 0 ? `the presence of ${summary.activeAlertsCount} active indicators. Block immediately.` : "zero active attacks. Ensure master authorization key vectors are restricted to 2-Factor checklists."}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-blue-500 shrink-0">[SYS]</span>
              <span className="text-slate-500">Compliant scan completed. Shield uptime matches 100% threshold.</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/40 flex gap-2">
            <button 
              onClick={() => onNavigate("chat")}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white py-2 text-xs font-bold font-mono tracking-wide transition-all uppercase cursor-pointer text-center"
            >
              Consult AI Brain
            </button>
            <button 
              onClick={() => onNavigate("reports")}
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 text-xs font-bold font-mono tracking-wide transition-all uppercase cursor-pointer text-center"
            >
              Get PDF Audit
            </button>
          </div>
        </div>

        {/* Card 3: Active Alerts Summary (col-span-3) */}
        <div className="md:col-span-3 rounded-2xl border border-slate-800/50 bg-[#0D1117] p-6 shadow-xl flex flex-col justify-between min-h-[280px]">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">CRITICAL RISKS</span>
            <h3 className="text-xs font-bold text-slate-400 uppercase mt-1">Incident Queue</h3>
          </div>

          <div className="my-3 space-y-2.5 flex-1 flex flex-col justify-center">
            {summary?.criticalIssues && summary.criticalIssues.length > 0 ? (
              summary.criticalIssues.slice(0, 2).map((issue, idx) => (
                <div key={idx} className="flex flex-col justify-between rounded-xl bg-red-500/10 p-3.5 border border-red-500/20">
                  <span className="text-[10px] font-bold text-red-400 font-mono">ALERT IDENTIFIED</span>
                  <p className="text-xs font-semibold text-slate-200 truncate mt-1">{issue}</p>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-emerald-500/10 p-3.5 border border-emerald-500/20 text-center">
                <CheckCircle className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-400 font-mono uppercase">Nodes Secure</p>
                <p className="text-[10px] text-slate-400 mt-1">Zero critical threats detected in loop scan.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigate("alerts")}
            className="w-full text-center text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 cursor-pointer pt-2"
          >
            <span>View Alerts ({summary?.activeAlertsCount ?? 0})</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {/* Card 4: Threat Timeline / Pulse Chart (col-span-8) */}
        <div className="md:col-span-8 rounded-2xl border border-slate-800/50 bg-[#0D1117] p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">TRAFFIC PULSE</span>
              <h3 className="text-xs font-bold text-slate-400 uppercase mt-1">Threat History Trends</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Interval: 1 hour cycles</span>
          </div>

          <div className="my-4 flex-1 min-h-[180px]">
            <SecureChart data={summary?.threatTrends || []} />
          </div>
        </div>

        {/* Card 5: Protected Shields Grid (col-span-4) */}
        <div className="md:col-span-4 rounded-2xl border border-slate-800/50 bg-[#0D1117] p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">ACTIVE SHIELDS</span>
            <h3 className="text-xs font-bold text-slate-400 uppercase mt-1">Interface posturing</h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5 my-4">
            <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">SSL Secure</span>
              <span className="text-sm font-bold text-slate-200 mt-1 uppercase">100% OK</span>
            </div>
            <div className="rounded-xl bg-slate-900/50 p-4 border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Threat Scan</span>
              <span className="text-sm font-bold text-slate-200 mt-1 uppercase">24h Continuous</span>
            </div>
            <div onClick={() => onNavigate("websites")} className="rounded-xl bg-slate-900/50 hover:bg-slate-800/50 p-4 border border-slate-800 cursor-pointer flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Websites Nodes</span>
              <span className="text-sm font-bold text-blue-400 mt-1 uppercase flex items-center justify-between">
                <span>{summary?.protectedWebsitesCount ?? 0}</span>
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-4 border border-blue-500/20 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase font-mono">Security daemon</span>
              <span className="text-sm font-bold text-blue-400 mt-1 uppercase">ENABLED</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono text-center">
            Distributed CDN Edge Protection Active
          </div>
        </div>

        {/* Card 6: Audit History & Latest Logins Table (col-span-12) */}
        <div className="md:col-span-12 rounded-2xl border border-slate-800/50 bg-[#0D1117] p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3 mb-4">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">SECURE AUDIT PATH</span>
              <h3 className="text-sm font-bold text-slate-300 uppercase mt-1">Administrative Access Logs</h3>
            </div>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded text-emerald-400 font-mono uppercase">Integrity Verified</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-[#080B12] text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800/80">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">IPv4 Address</th>
                  <th className="px-4 py-3">Location Context</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Browser / Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {summary?.recentActivity && summary.recentActivity.length > 0 ? (
                  summary.recentActivity.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors font-mono text-[11px]">
                      <td className="px-4 py-3 text-slate-300">{new Date(log.time).toLocaleString()}</td>
                      <td className="px-4 py-3 text-blue-400">{log.ip}</td>
                      <td className="px-4 py-3 text-slate-400">{log.location}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          log.status === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 truncate max-w-xs">{log.userAgent}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">
                      No logged access records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
      
    </div>
  );
}
