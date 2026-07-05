import React, { useState, useEffect } from "react";
import { Settings, Save, BellRing, User, ShieldCheck, Loader2, AlertCircle, VolumeX } from "lucide-react";
import { User as UserType } from "../types";

interface SettingsPanelProps {
  user: UserType | null;
  token: string;
  onRefreshUser: () => Promise<void>;
}

export default function SettingsPanel({ user, token, onRefreshUser }: SettingsPanelProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  
  // Notification channels checkbox state
  const [emailNotify, setEmailNotify] = useState(true);
  const [smsNotify, setSmsNotify] = useState(false);
  const [slackNotify, setSlackNotify] = useState(false);
  const [teamsNotify, setTeamsNotify] = useState(false);
  const [pushNotify, setPushNotify] = useState(true);

  const [frequency, setFrequency] = useState<"realtime" | "daily" | "weekly">("realtime");
  const [severityThreshold, setSeverityThreshold] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Quiet Hours states
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("06:00");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setCompany(user.company);
      if (user.settings) {
        const setts = user.settings;
        setEmailNotify(setts.preferredChannels?.email ?? true);
        setSmsNotify(setts.preferredChannels?.sms ?? false);
        setSlackNotify(setts.preferredChannels?.slack ?? false);
        setTeamsNotify(setts.preferredChannels?.teams ?? false);
        setPushNotify(setts.preferredChannels?.push ?? true);
        setFrequency(setts.notificationFrequency ?? "realtime");
        setSeverityThreshold(setts.severityThreshold ?? "medium");
        setMfaEnabled(setts.mfaEnabled ?? false);
        setQuietEnabled(setts.quietHours?.enabled ?? false);
        setQuietStart(setts.quietHours?.start ?? "22:00");
        setQuietEnd(setts.quietHours?.end ?? "06:00");
      }
    }
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const payload = {
      fullName,
      company,
      preferredChannels: {
        email: emailNotify,
        sms: smsNotify,
        slack: slackNotify,
        teams: teamsNotify,
        push: pushNotify,
      },
      notificationFrequency: frequency,
      quietHours: {
        enabled: quietEnabled,
        start: quietStart,
        end: quietEnd,
      },
      severityThreshold,
      mfaEnabled,
    };

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to finalize preferences update.");
      }

      setSuccess("Profile settings and notification rules saved successfully.");
      await onRefreshUser();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-4xl">
      
      {/* Title Header */}
      <div className="border-b border-slate-800/60 pb-5">
        <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-500" />
          <span>System Settings</span>
        </h1>
        <p className="text-xs text-slate-500">
          Reconfigure administrative credentials, notification channels, quiet hours rules, and 2-Factor posture checklists.
        </p>
      </div>

      {/* Save Success / Error banners */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400 font-sans">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 font-sans">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Form Layout */}
      <form onSubmit={handleSaveSettings} className="space-y-4">
        
        {/* Section 1: User Profile Details */}
        <div className="rounded-2xl bg-[#0D1117] border border-slate-800/50 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-slate-800/60 pb-2">
            <User className="h-4 w-4" />
            <span>Profile Credentials Node</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all font-sans"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Company / Organization</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-xl bg-[#0b101f] border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-xs text-white focus:outline-none transition-all font-sans"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Alert Channels Preference sliders */}
        <div className="rounded-2xl bg-[#0D1117] border border-slate-800/50 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-slate-800/60 pb-2">
            <BellRing className="h-4 w-4" />
            <span>Active Alarm Channels</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-300">
            {/* Left Channel selection toggles */}
            <div className="space-y-3">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Available Pipelines</span>
              
              <div className="flex items-center justify-between">
                <span>E-Mail Address Alerts:</span>
                <input
                  type="checkbox"
                  checked={emailNotify}
                  onChange={(e) => setEmailNotify(e.target.checked)}
                  className="rounded-lg bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Mobile SMS (Critical Only):</span>
                <input
                  type="checkbox"
                  checked={smsNotify}
                  onChange={(e) => setSmsNotify(e.target.checked)}
                  className="rounded-lg bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Slack webhook endpoint:</span>
                <input
                  type="checkbox"
                  checked={slackNotify}
                  onChange={(e) => setSlackNotify(e.target.checked)}
                  className="rounded-lg bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Microsoft Teams integration:</span>
                <input
                  type="checkbox"
                  checked={teamsNotify}
                  onChange={(e) => setTeamsNotify(e.target.checked)}
                  className="rounded-lg bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Direct Web Browser Push notification:</span>
                <input
                  type="checkbox"
                  checked={pushNotify}
                  onChange={(e) => setPushNotify(e.target.checked)}
                  className="rounded-lg bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>
            </div>

            {/* Right frequency & severity settings parameters */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Notification Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 font-mono cursor-pointer"
                >
                  <option value="realtime">Real-Time Instantly</option>
                  <option value="daily">Daily Summary digests</option>
                  <option value="weekly">Weekly SOC-2 digests</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Minimum Reporting Severity Threshold</label>
                <select
                  value={severityThreshold}
                  onChange={(e) => setSeverityThreshold(e.target.value as any)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 font-mono cursor-pointer"
                >
                  <option value="low">Low (Include all anomalies)</option>
                  <option value="medium">Medium (Advised defaults)</option>
                  <option value="high">High (Suppress minor alerts)</option>
                  <option value="critical">Critical (Vulnerabilities only)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Quiet hours Scheduler */}
        <div className="rounded-2xl bg-[#0D1117] border border-slate-800/50 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-slate-800/60 pb-2">
            <VolumeX className="h-4 w-4" />
            <span>Muted Quiet Hours Windows</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Activate Quiet Hours rules:</span>
                <input
                  type="checkbox"
                  checked={quietEnabled}
                  onChange={(e) => setQuietEnabled(e.target.checked)}
                  className="rounded-lg bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans mt-2">
                When enabled, non-critical alerts will be buffered and sent after quiet hours conclude. Critical severity exploits bypass this limit automatically.
              </p>
            </div>

            {quietEnabled && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Start Time</label>
                  <input
                    type="text"
                    required
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    placeholder="22:00"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50 text-center font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">End Time</label>
                  <input
                    type="text"
                    required
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    placeholder="06:00"
                    className="w-full rounded-xl bg-[#0b101f] border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/5 text-center font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: MFA 2FA Settings */}
        <div className="rounded-2xl bg-[#0D1117] border border-slate-800/50 p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-widest border-b border-slate-800/60 pb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Administrative Multi-Factor Authentications</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="block font-semibold">MFA Validation (Recommended):</span>
              <p className="text-[10px] text-slate-500 mt-1">
                Prompt for temporary authentication codes upon logging in.
              </p>
            </div>
            <input
              type="checkbox"
              checked={mfaEnabled}
              onChange={(e) => setMfaEnabled(e.target.checked)}
              className="rounded-lg bg-slate-900 border-slate-800 text-blue-500 focus:ring-0 cursor-pointer h-5 w-5"
            />
          </div>
        </div>

        {/* Submit Save bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            id="btn-settings-save"
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest px-6 py-3 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4.5 w-4.5" />}
            <span>{saving ? "Updating Registry..." : "Save Preferences"}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
