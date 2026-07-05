import React, { useState } from "react";
import { 
  Globe, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  RefreshCw, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Terminal,
  X 
} from "lucide-react";
import { Website, User } from "../types";

interface WebsitesManagerProps {
  user: User | null;
  token: string;
  websites: Website[];
  onAddWebsite: (name: string, url: string) => Promise<void>;
  onDeleteWebsite: (id: string) => Promise<void>;
  onRefreshWebsites: () => Promise<void>;
}

export default function WebsitesManager({ 
  user, 
  token, 
  websites, 
  onAddWebsite, 
  onDeleteWebsite, 
  onRefreshWebsites 
}: WebsitesManagerProps) {
  // Add site form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Scan states
  const [scanningId, setScanningId] = useState<string | null>(null);
  
  // Detail Overlay Modal State
  const [selectedSite, setSelectedSite] = useState<Website | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form submit handler
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!siteName || !siteUrl) {
      setAddError("Name and URL fields are required.");
      return;
    }

    // Format URL
    let formattedUrl = siteUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    setAdding(true);
    try {
      await onAddWebsite(siteName, formattedUrl);
      setSiteName("");
      setSiteUrl("");
      setShowAddModal(false);
    } catch (err: any) {
      setAddError(err.message || "Failed to catalog website node.");
    } finally {
      setAdding(false);
    }
  };

  // Run a manual scan trigger on a specific website card
  const handleManualScan = async (website: Website, e: React.MouseEvent) => {
    e.stopPropagation();
    setScanningId(website.id);

    try {
      const res = await fetch(`/api/websites/${website.id}/scan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to run active scan audit.");
      }

      await onRefreshWebsites();
      
      // Auto-open findings modal after manual scan!
      if (data.website) {
        setSelectedSite(data.website);
        setLiveAnalysis(data.analysis);
      }
    } catch (err: any) {
      alert("Scan execution failed: " + err.message);
    } finally {
      setScanningId(null);
    }
  };

  // Fetch full details of a site for the modal overlay
  const handleOpenDetails = async (website: Website) => {
    setSelectedSite(website);
    setLoadingDetails(true);
    setLiveAnalysis(null);

    try {
      // Execute scan or fetch scan stats from backend
      const res = await fetch(`/api/websites/${website.id}/scan`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLiveAnalysis(data.analysis);
      }
    } catch (err) {
      console.error("Failed to retrieve live site headers analysis:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedSite(null);
    setLiveAnalysis(null);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Upper Title and Options Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-500" />
            <span>Guarded Website Nodes</span>
          </h1>
          <p className="text-xs text-slate-500">
            Provision, monitor, and audit TLS certification pipelines and security response headers dynamically.
          </p>
        </div>

        <button
          onClick={() => {
            setAddError(null);
            setShowAddModal(true);
          }}
          id="btn-add-website-modal"
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest px-4 py-2.5 shadow-lg shadow-blue-600/10 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Provision Node</span>
        </button>
      </div>

      {/* Grid List of Websites Cards */}
      {websites && websites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((web) => {
            const isCritical = web.securityScore < 70;
            const isWarning = web.securityScore >= 70 && web.securityScore < 85;

            const borderGlow = isCritical 
              ? "hover:border-rose-500/40 hover:shadow-rose-500/5" 
              : isWarning 
                ? "hover:border-amber-500/40 hover:shadow-amber-500/5" 
                : "hover:border-blue-500/40 hover:shadow-blue-500/5";

            const scoreColor = isCritical 
              ? "text-rose-500 border-rose-500/20 bg-rose-500/5" 
              : isWarning 
                ? "text-amber-500 border-amber-500/20 bg-amber-500/5" 
                : "text-blue-400 border-blue-500/20 bg-blue-500/5";

            return (
              <div
                key={web.id}
                onClick={() => handleOpenDetails(web)}
                className={`group rounded-2xl bg-[#0D1117] border border-slate-800/50 p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between h-56 ${borderGlow}`}
              >
                {/* Upper card info */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="max-w-[170px]">
                      <h3 className="font-display text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors uppercase">
                        {web.name}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                        {web.url}
                      </p>
                    </div>

                    {/* Security Score Badge */}
                    <div className={`rounded-xl border px-2.5 py-1.5 text-center font-display text-sm font-bold leading-none ${scoreColor}`}>
                      {web.securityScore}%
                    </div>
                  </div>

                  {/* TLS Indicators */}
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">TLS Protection (HTTPS)</span>
                      <span className="font-mono text-[11px] font-semibold">
                        {web.httpsStatus ? (
                          <span className="text-emerald-400">ENCRYPTED</span>
                        ) : (
                          <span className="text-rose-500 animate-pulse">PLAIN-TEXT HTTP</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-sans">SSL Certification Status</span>
                      <span className="font-mono text-[11px] font-semibold">
                        {web.sslStatus === "valid" ? (
                          <span className="text-emerald-400">VALID</span>
                        ) : web.sslStatus === "warning" ? (
                          <span className="text-amber-400">EXPIRING</span>
                        ) : (
                          <span className="text-rose-500 font-bold">EXPIRED/INVALID</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom card interactions */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between shrink-0">
                  <div className="text-[9px] font-mono text-slate-500">
                    SSL Expires: {web.sslExpiresDays !== undefined ? `${web.sslExpiresDays} days` : "Unknown"}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleManualScan(web, e)}
                      disabled={scanningId === web.id}
                      className="rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/20 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-blue-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Run live active headers audit"
                    >
                      {scanningId === web.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      <span>{scanningId === web.id ? "Analyzing..." : "Scan"}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove web node ${web.name} from active guard duty?`)) {
                          onDeleteWebsite(web.id);
                        }
                      }}
                      className="rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/20 px-2.5 py-1.5 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove domain node"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800/60 p-12 text-center bg-[#0D1117] shadow-xl">
          <Globe className="h-10 w-10 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h3 className="font-display text-sm font-bold text-slate-300 uppercase tracking-wide">
            No Protected Nodes Defined
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
            Begin guarding your internet properties by adding your first website node above. Our automated daemon handles the rest.
          </p>
        </div>
      )}

      {/* MODAL 1: ADD WEBSITE POPUP FORM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1117] border border-slate-800 p-6 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-600/5 blur-2xl"></div>
            
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                Catalog Website Node
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 font-sans">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Website Identifier</label>
                <input
                  type="text"
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="My Customer Portal"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">URL Address (HTTP or HTTPS)</label>
                <input
                  type="text"
                  required
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-slate-400 border border-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  id="btn-add-website-submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest px-4 py-2.5 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{adding ? "Scanning..." : "Add & Scan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAILED VULNERABILITY ANALYSIS AND RECOMMENDED CODE SCRIPTS OVERLAY */}
      {selectedSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4 overflow-y-auto py-10">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0D1117] border border-slate-800 p-6 shadow-2xl my-auto text-left relative overflow-hidden">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-600/5 blur-3xl"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block font-bold">VULNERABILITY PROFILING RECORD</span>
                <h3 className="font-display text-base font-extrabold text-white uppercase tracking-wider mt-1">
                  {selectedSite.name}
                </h3>
              </div>
              <button 
                onClick={handleCloseDetails}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content Loading */}
            {loadingDetails ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  <span className="text-xs font-mono text-slate-500">REQUESTING RE-SCAN HEADERS METRICS...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Upper findings checklist indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* TLS & Certificate validation details */}
                  <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800">
                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-semibold block">Transport & SSL Summary</span>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">TLS Encryption:</span>
                        <span className="font-mono font-bold text-[11px]">{selectedSite.httpsStatus ? <span className="text-emerald-400">ENCRYPTED</span> : <span className="text-rose-500">PLAINTEXT</span>}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Certificate Authority:</span>
                        <span className="font-mono text-slate-300 font-bold">{selectedSite.sslStatus === "valid" ? "Verified Root CA" : "Self-Signed / Warning"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Days To Expiry:</span>
                        <span className="font-mono font-bold text-slate-200">{selectedSite.sslExpiresDays || 0} days left</span>
                      </div>
                    </div>
                  </div>

                  {/* Overall Compliance Rating */}
                  <div className="rounded-xl bg-slate-900/40 p-4 border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-semibold block">Audit Posture</span>
                      <p className="text-xs text-slate-400 mt-2">
                        This site has implemented <span className="text-blue-400 font-mono font-bold">{selectedSite.securityHeadersCount || 0}/5</span> fundamental security headers configurations.
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      {selectedSite.securityScore >= 80 ? (
                        <span className="text-emerald-400 font-mono font-bold flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> COMPLIANCE PASSED</span>
                      ) : (
                        <span className="text-amber-400 font-mono font-bold flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> IMPROVEMENTS ADVISED</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Specific Header Audit Status Details */}
                {liveAnalysis?.securityHeaders && (
                  <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-4">
                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-bold block mb-3">HTTP Security Headers Audits</span>
                    <div className="space-y-2.5">
                      {Object.entries(liveAnalysis.securityHeaders).map(([header, present]) => (
                        <div key={header} className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/40 text-xs">
                          <code className="text-blue-400 font-mono text-[11px]">{header}</code>
                          {present ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] font-bold"><CheckCircle className="h-3.5 w-3.5" /> SECURE</span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-500 font-mono text-[10px] font-bold animate-pulse"><AlertTriangle className="h-3.5 w-3.5" /> MISSING</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mitigation Code Block Recommendations */}
                <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400 uppercase tracking-widest">
                    <Terminal className="h-4 w-4" />
                    <span>Nginx Mitigation Configuration Patch</span>
                  </div>
                  <pre className="rounded-xl bg-slate-950 p-3.5 text-[10px] font-mono text-slate-300 border border-slate-900/60 overflow-x-auto leading-relaxed">
{`# Add missing secure response headers in /etc/nginx/nginx.conf
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline';" always;`}
                  </pre>
                </div>

              </div>
            )}

            {/* Close footer button */}
            <div className="mt-6 border-t border-slate-800/60 pt-3 flex justify-end">
              <button
                onClick={handleCloseDetails}
                className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest px-5 py-2.5 transition-colors cursor-pointer"
              >
                Acknowledge Findings
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
