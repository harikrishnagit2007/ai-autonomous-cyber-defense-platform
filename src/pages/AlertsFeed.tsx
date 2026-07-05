import React, { useState } from "react";
import { 
  AlertOctagon, 
  CheckCircle, 
  CheckCheck, 
  ChevronDown, 
  ChevronUp, 
  Terminal,
  Activity
} from "lucide-react";
import { Alert } from "../types";

interface AlertsFeedProps {
  token: string;
  alerts: Alert[];
  onRefreshAlerts: () => Promise<void>;
}

export default function AlertsFeed({ token, alerts, onRefreshAlerts }: AlertsFeedProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleMarkAsRead = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/alerts/${alertId}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await onRefreshAlerts();
      }
    } catch (err) {
      console.error("Failed to update alert state:", err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Acknowledge all active unread threat alerts?")) return;
    try {
      const res = await fetch("/api/alerts/clear-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await onRefreshAlerts();
      }
    } catch (err) {
      console.error("Failed to execute clear-all alert states:", err);
    }
  };

  // Filter alerts lists
  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity = filterSeverity === "all" || a.severity.toLowerCase() === filterSeverity.toLowerCase();
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "unread" && a.status === "unread") ||
      (filterStatus === "read" && a.status === "read");
    return matchesSeverity && matchesStatus;
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Upper Title and Options Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <AlertOctagon className="h-6 w-6 text-rose-500 animate-pulse" />
            <span>Threats & Alerts Log</span>
          </h1>
          <p className="text-xs text-slate-500">
            Real-time telemetry indicators of vulnerability exposures and malicious traffic intercepts.
          </p>
        </div>

        {alerts.some((a) => a.status === "unread") && (
          <button
            onClick={handleClearAll}
            id="btn-alerts-clear-all"
            className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/30 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-blue-400 transition-colors cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            <span>Acknowledge All</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar controls */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0D1117] p-4 rounded-2xl border border-slate-800/50 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
          <span>Filter Telemetry:</span>
        </div>

        {/* Severity dropdown select */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Status dropdown select */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="unread">Unresolved Alerts</option>
          <option value="read">Acknowledged</option>
        </select>
      </div>

      {/* Main Alerts Feed Stack */}
      {filteredAlerts && filteredAlerts.length > 0 ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            const isUnread = alert.status === "unread";
            const sevStyles = getSeverityStyles(alert.severity);

            return (
              <div
                key={alert.id}
                onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                className={`rounded-2xl bg-[#0D1117] border transition-all duration-300 cursor-pointer overflow-hidden ${
                  isUnread 
                    ? "border-slate-800/80 hover:border-blue-500/20 shadow-md" 
                    : "border-slate-900/60 opacity-60 hover:opacity-100"
                }`}
              >
                {/* Visible Header Bar */}
                <div className="flex items-center justify-between p-4.5 flex-wrap sm:flex-nowrap gap-3">
                  <div className="flex items-start gap-3">
                    {/* Status dot */}
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${
                      isUnread ? "bg-rose-500 animate-pulse" : "bg-slate-600"
                    }`} />
                    
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-xs font-bold text-white uppercase tracking-wider">
                          {alert.threatName}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[8px] font-mono font-bold uppercase border ${sevStyles}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-mono text-blue-400">
                          [{alert.websiteName}]
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        Reported: {new Date(alert.time).toLocaleString()} UTC
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto shrink-0">
                    {isUnread && (
                      <button
                        onClick={(e) => handleMarkAsRead(alert.id, e)}
                        className="rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/20 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-blue-400 transition-colors cursor-pointer"
                        title="Acknowledge Threat Alert"
                      >
                        Acknowledge
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </div>
                </div>

                {/* Expanded Details body */}
                {isExpanded && (
                  <div className="border-t border-slate-800/60 p-5 bg-[#080B12]/50 space-y-4 text-left">
                    {/* AI Threat Context */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-400 uppercase tracking-widest font-semibold">
                        <Terminal className="h-3.5 w-3.5" />
                        <span>AI Threat Summary Context</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans">
                        {alert.aiSummary}
                      </p>
                    </div>

                    {/* Recommended Action steps */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Autonomous Action Directive</span>
                      </div>
                      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] p-3.5 text-xs text-emerald-400 font-mono max-w-2xl leading-relaxed">
                        {alert.recommendedAction}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800/60 p-12 text-center bg-[#0D1117] shadow-xl">
          <Activity className="h-10 w-10 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h3 className="font-display text-sm font-bold text-slate-300 uppercase tracking-wide">
            Zero Threat Indicators Registered
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
            Your protected website nodes are clean, securely encrypted, and reporting perfect security postures.
          </p>
        </div>
      )}
    </div>
  );
}
