import React, { useState } from "react";
import { Shield, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { User } from "../types";

interface AuthPagesProps {
  initialMode: "login" | "register" | "forgot";
  onAuthSuccess: (token: string, user: User) => void;
  onNavigate: (route: string) => void;
}

export default function AuthPages({ initialMode, onAuthSuccess, onNavigate }: AuthPagesProps) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode);
  
  // Form States
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status handlers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Helper clear
  const clearStatus = () => {
    setError(null);
    setSuccess(null);
    setResetToken(null);
  };

  const handleToggleMode = (newMode: "login" | "register" | "forgot") => {
    setMode(newMode);
    clearStatus();
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all mandatory parameters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password parameters do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please read and accept the Sentinel Platform Terms.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, company }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to finalize registration.");
      }

      setSuccess("Account established successfully!");
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();

    if (!email || !password) {
      setError("Email and password parameters are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid user credentials.");
      }

      setSuccess("Authentication success. Establishing session...");
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();

    if (!email) {
      setError("Please fill in your registered email parameter.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process reset query.");
      }

      setSuccess(data.message);
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Simulated Password Change with Reset Token
  const handlePasswordChangeWithReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();

    if (!password) {
      setError("Please provide a new secure password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update security credentials.");
      }

      setSuccess("Security credentials updated! Redirecting to credentials portal...");
      setTimeout(() => {
        handleToggleMode("login");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#05070a] px-4 py-12 cyber-grid">
      
      {/* Back button to Home */}
      <button 
        onClick={() => onNavigate("landing")}
        id="btn-auth-back-home"
        className="absolute top-6 left-6 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-mono uppercase tracking-widest text-blue-400 border border-slate-800 hover:border-slate-700 transition-all duration-300 cursor-pointer"
      >
        <Shield className="h-4 w-4" />
        <span>Exit Portal</span>
      </button>

      {/* Floating neon blobs */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-64 w-64 rounded-full bg-blue-600/5 blur-[80px]"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-64 w-64 rounded-full bg-indigo-500/5 blur-[80px]"></div>

      {/* Auth Card Panel */}
      <div className="w-full max-w-md rounded-2xl bg-[#0D1117] border border-slate-800/80 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-blue-600/5 blur-2xl"></div>
        
        {/* Branding header */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3">
            <Shield className="h-5 w-5 text-blue-400 animate-pulse" />
          </div>
          <h2 className="font-display text-lg font-bold text-white uppercase tracking-wider">
            {mode === "login" ? "Security Core Login" : mode === "register" ? "Establish Sentinel Node" : "Reset Security Key"}
          </h2>
          <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
            {mode === "login" ? "Enter administrative credentials" : mode === "register" ? "Establish new admin registry" : "Provide registered email profile"}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div id="auth-error-banner" className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3.5 text-xs text-rose-400 font-sans">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        {success && (
          <div id="auth-success-banner" className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 font-sans">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
            <span className="leading-normal">{success}</span>
          </div>
        )}

        {/* FORGOT PASSWORD: Reset password with returned token */}
        {mode === "forgot" && resetToken ? (
          <form onSubmit={handlePasswordChangeWithReset} className="space-y-4">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3.5 text-center">
              <span className="block text-[10px] font-mono text-blue-400 uppercase tracking-widest">RESET KEY VALIDATED</span>
              <code className="text-xs font-mono font-bold text-white mt-1 block">{resetToken}</code>
            </div>
            
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">New Secure Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest py-3 transition-colors duration-300 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save New Credentials"}
            </button>
          </form>
        ) : mode === "forgot" ? (
          /* FORGOT PASSWORD: Basic Email query form */
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Registered Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cyberdefense.ai"
                className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="btn-forgot-submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest py-3 transition-colors duration-300 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dispatched Reset Token"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Recall credentials?{" "}
              <button 
                type="button" 
                onClick={() => handleToggleMode("login")}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          </form>
        ) : mode === "register" ? (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Hari Krishna"
                className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all font-sans"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Enterprise Company Name (Optional)</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Apex Tech Labs"
                className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all font-sans"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Admin Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cyberdefense.ai"
                className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Master Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1 text-left">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0"
              />
              <label htmlFor="agree-terms" className="text-[10px] text-slate-400 font-mono uppercase tracking-wider cursor-pointer">
                I accept the terms of the Autonomous Shield Protocol
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="btn-register-submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest py-3 transition-colors duration-300 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Establish Registry"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Already have an established Node?{" "}
              <button 
                type="button" 
                onClick={() => handleToggleMode("login")}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          </form>
        ) : (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Admin Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cyberdefense.ai"
                className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all font-mono"
              />
            </div>

            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Administrative Password</label>
                <button
                  type="button"
                  onClick={() => handleToggleMode("forgot")}
                  id="btn-auth-forgot"
                  className="text-[10px] font-mono uppercase tracking-wider text-blue-400 hover:underline cursor-pointer"
                >
                  Forgot Key?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-900/50 border border-slate-800 focus:border-blue-500 pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1 text-left">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-800 text-blue-500 focus:ring-0"
                />
                <label htmlFor="remember-me" className="text-[10px] text-slate-400 font-mono uppercase tracking-wider cursor-pointer">
                  Maintain active session
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="btn-login-submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest py-3 transition-all duration-300 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Access Platform"}
            </button>

            <p className="text-center text-xs text-slate-500">
              New to Sentinel Operations?{" "}
              <button 
                type="button" 
                onClick={() => handleToggleMode("register")}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </form>
        )}

        {/* OAuth Integration Block */}
        <div className="mt-6 pt-6 border-t border-slate-800/60">
          <span className="block text-center text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
            Cryptographic Single Sign On
          </span>
          <div className="grid grid-cols-3 gap-2">
            <a 
              href="/api/auth/google"
              id="btn-sso-google"
              className="flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 py-2 text-xs text-slate-300 transition-colors cursor-pointer"
              title="Continue with Google Workspace"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.92-2.75 3.51-4.51 6.76-4.51z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.51h6.43c-.28 1.45-1.1 2.68-2.33 3.51v2.92h3.76c2.2-2.02 3.63-5 3.63-8.6z"/>
                <path fill="#FBBC05" d="M5.24 10.55A7.19 7.19 0 0 1 5 12c0 .51.04 1.01.12 1.5l-3.85 2.99A11.94 11.94 0 0 1 1 12c0-1.58.31-3.09.87-4.49l3.37 3.04z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.76-2.92c-1.04.7-2.38 1.12-4.2 1.12-3.25 0-5.84-1.76-6.76-4.51H1.39v2.99A11.94 11.94 0 0 0 12 23z"/>
              </svg>
            </a>
            <a 
              href="/api/auth/github"
              id="btn-sso-github"
              className="flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 py-2 text-xs text-slate-300 transition-colors cursor-pointer"
              title="Continue with GitHub DevOps"
            >
              <svg className="h-4 w-4 fill-current shrink-0 text-slate-300" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
            <a 
              href="/api/auth/microsoft"
              id="btn-sso-microsoft"
              className="flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 py-2 text-xs text-slate-300 transition-colors cursor-pointer"
              title="Continue with Microsoft Azure"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
