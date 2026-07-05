import { 
  Shield, 
  Terminal, 
  Layers, 
  FileText, 
  Settings, 
  AlertOctagon, 
  LogOut,
  Globe
} from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export default function Sidebar({ onLogout, isOpen, onToggle, activeRoute, onNavigate }: SidebarProps) {
  const menuItems = [
    { name: "Dashboard", path: "dashboard", icon: Layers },
    { name: "AI Chat Brain", path: "chat", icon: Terminal },
    { name: "Websites Nodes", path: "websites", icon: Globe },
    { name: "Threats & Alerts", path: "alerts", icon: AlertOctagon },
    { name: "Security Reports", path: "reports", icon: FileText },
    { name: "System Settings", path: "settings", icon: Settings },
  ];

  return (
    <>
      {/* Sidebar Container */}
      <aside 
        id="cyber-sidebar"
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-[#080B12] border-r border-slate-800/80 pt-16 transition-transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto px-4 py-6">
          {/* Main Menu Links */}
          <ul className="space-y-2 font-medium">
            <li className="mb-4 text-xs font-mono text-slate-500 uppercase tracking-widest pl-3">
              Core Operations
            </li>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => {
                      onNavigate(item.path);
                      if (window.innerWidth < 768) onToggle();
                    }}
                    id={`menu-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-300 group cursor-pointer text-left ${
                      isActive 
                        ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 font-semibold shadow-[0_0_15px_rgba(37,99,235,0.08)]" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? "text-blue-400" : "text-slate-400 group-hover:text-blue-300"
                    }`} />
                    <span>{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* System Footer & Logout Action */}
          <div className="mt-auto space-y-4 pt-4 border-t border-slate-800/60">
            <div className="rounded-xl bg-blue-500/5 p-3.5 border border-blue-500/15">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-mono font-semibold text-blue-400">SENTINEL EDGE</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight font-mono">
                Autonomous Response Active (v4.2)
              </p>
            </div>

            <button
              onClick={onLogout}
              id="btn-sidebar-logout"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              <span>Secure Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile screen drawer */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        ></div>
      )}
    </>
  );
}
