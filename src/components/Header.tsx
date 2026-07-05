import { Shield, Bell, Menu, Cpu } from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  user: User | null;
  unreadAlertsCount: number;
  onMenuToggle: () => void;
  onNavigate: (route: string) => void;
}

export default function Header({ user, unreadAlertsCount, onMenuToggle, onNavigate }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 z-50 w-full bg-[#080B12] border-b border-slate-800/80 px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Left: Mobile Menu Trigger + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            id="btn-mobile-menu"
            className="rounded-md p-1.5 text-gray-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Toggle Sidebar Menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <button 
            onClick={() => onNavigate("landing")}
            className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/10 border border-blue-500/30 group-hover:border-blue-500/60 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.15)]">
              <Shield className="h-5 w-5 text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute -inset-0.5 -z-10 rounded-lg bg-blue-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent block leading-tight">
                CYBER SENTINEL
              </span>
              <span className="hidden sm:inline-block rounded bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-widest text-blue-400 border border-blue-400/20">
                AI platform
              </span>
            </div>
          </button>
        </div>

        {/* Center: Live Intelligence status banner for desktop */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/20 text-xs font-mono">
          <div className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]"></div>
          <span className="text-slate-500">Security Core:</span>
          <span className="text-blue-400 font-semibold uppercase">ACTIVE-SHIELD ONLINE</span>
        </div>

        {/* Right: Notification Alerts + User Widget */}
        <div className="flex items-center gap-4">
          
          {/* Threats Alert Hub Bell with Numeric Badge */}
          <button 
            onClick={() => onNavigate("alerts")}
            id="btn-header-alerts"
            className="relative rounded-lg p-2 text-gray-400 hover:bg-slate-800/40 hover:text-blue-400 transition-colors cursor-pointer focus:outline-none"
          >
            <Bell className="h-5 w-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#080B12] animate-bounce">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Summary */}
          {user && (
            <button 
              onClick={() => onNavigate("settings")}
              id="header-profile-link"
              className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-800/30 transition-colors cursor-pointer text-left focus:outline-none"
            >
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-8 w-8 rounded-full border border-blue-500/30 bg-[#0d1426]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.fullName)}`;
                }}
              />
              <div className="hidden lg:block text-left text-xs">
                <p className="font-medium text-slate-200">{user.fullName}</p>
                <p className="text-[10px] font-mono text-blue-400/70">{user.company}</p>
              </div>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
