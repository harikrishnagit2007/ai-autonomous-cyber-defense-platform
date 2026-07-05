import { useState, useEffect } from "react";
import { User, Website, Alert } from "./types";

// Page Views
import LandingPage from "./pages/LandingPage";
import AuthPages from "./pages/AuthPages";
import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";
import WebsitesManager from "./pages/WebsitesManager";
import AlertsFeed from "./pages/AlertsFeed";
import ReportsHub from "./pages/ReportsHub";
import SettingsPanel from "./pages/SettingsPanel";

// Global Layout Components
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { RefreshCw } from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("sentinel_token"));
  const [user, setUser] = useState<User | null>(null);
  
  // Custom router state: landing | login | register | forgot | dashboard | chat | websites | alerts | reports | settings
  const [activeRoute, setActiveRoute] = useState<string>("landing");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Data Lists Shared States
  const [websites, setWebsites] = useState<Website[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Capture SSO Redirect URL tokens
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ssoToken = params.get("token");
    if (ssoToken) {
      localStorage.setItem("sentinel_token", ssoToken);
      setToken(ssoToken);
      // Clean query params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch Current Profile Session on Load
  const fetchProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setUser(data);
        // If they are on a non-dashboard route (like landing/login), direct them into dashboard core!
        if (["landing", "login", "register", "forgot"].includes(activeRoute)) {
          setActiveRoute("dashboard");
        }
      } else {
        // Token stale - clear credentials
        handleLogout();
      }
    } catch (err) {
      console.error("Failed to load user credentials session:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch websites metrics from backend
  const fetchWebsites = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/websites", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWebsites(data);
      }
    } catch (err) {
      console.error("Failed to fetch websites list:", err);
    }
  };

  // Fetch alert telemetry records
  const fetchAlerts = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/alerts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAlerts(data);
      }
    } catch (err) {
      console.error("Failed to fetch active alerts list:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchWebsites();
      fetchAlerts();
    }
  }, [user]);

  // Session Authentication triggers
  const handleAuthSuccess = (newToken: string, authenticatedUser: User) => {
    localStorage.setItem("sentinel_token", newToken);
    setToken(newToken);
    setUser(authenticatedUser);
    setActiveRoute("dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // fail silently
    }
    localStorage.removeItem("sentinel_token");
    setToken(null);
    setUser(null);
    setWebsites([]);
    setAlerts([]);
    setActiveRoute("landing");
  };

  // Navigation controller with implicit route guards
  const handleNavigate = (route: string) => {
    // If not authenticated, keep in public view paths
    if (!token && ["dashboard", "chat", "websites", "alerts", "reports", "settings"].includes(route)) {
      setActiveRoute("login");
      return;
    }
    setActiveRoute(route);
  };

  // Website crud actions
  const handleAddWebsite = async (name: string, url: string) => {
    const res = await fetch("/api/websites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name, url })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to add website node.");
    }
    // Refresh lists
    await fetchWebsites();
    await fetchAlerts();
  };

  const handleDeleteWebsite = async (id: string) => {
    const res = await fetch(`/api/websites/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      await fetchWebsites();
      await fetchAlerts();
    }
  };

  // Loader screen
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#050814] text-cyan-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
          <span className="tracking-widest uppercase">INITIALIZING CYBER SHIELD POSTURES...</span>
        </div>
      </div>
    );
  }

  // Count active alarm highlights
  const unreadAlertsCount = alerts.filter((a) => a.status === "unread").length;

  // ROUTE SWITCH DECISION TREE
  const renderViewContent = () => {
    switch (activeRoute) {
      case "landing":
        return <LandingPage onNavigate={handleNavigate} />;
      case "login":
        return <AuthPages initialMode="login" onAuthSuccess={handleAuthSuccess} onNavigate={handleNavigate} />;
      case "register":
        return <AuthPages initialMode="register" onAuthSuccess={handleAuthSuccess} onNavigate={handleNavigate} />;
      case "forgot":
        return <AuthPages initialMode="forgot" onAuthSuccess={handleAuthSuccess} onNavigate={handleNavigate} />;
      
      // Protected Dashboard paths
      case "dashboard":
        return (
          <Dashboard 
            user={user} 
            token={token!} 
            onNavigate={handleNavigate} 
            websites={websites} 
            onRefreshWebsites={fetchWebsites} 
          />
        );
      case "chat":
        return <AIChat user={user} token={token!} />;
      case "websites":
        return (
          <WebsitesManager 
            user={user} 
            token={token!} 
            websites={websites} 
            onAddWebsite={handleAddWebsite} 
            onDeleteWebsite={handleDeleteWebsite} 
            onRefreshWebsites={fetchWebsites} 
          />
        );
      case "alerts":
        return <AlertsFeed token={token!} alerts={alerts} onRefreshAlerts={fetchAlerts} />;
      case "reports":
        return <ReportsHub token={token!} />;
      case "settings":
        return <SettingsPanel user={user} token={token!} onRefreshUser={fetchProfile} />;
      
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  // Determine if full header + sidebar layout is active
  const isDashboardLayout = ["dashboard", "chat", "websites", "alerts", "reports", "settings"].includes(activeRoute);

  if (isDashboardLayout && user) {
    return (
      <div className="min-h-screen bg-[#070b19] text-gray-100 font-sans">
        
        {/* Dynamic header */}
        <Header 
          user={user} 
          unreadAlertsCount={unreadAlertsCount} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          onNavigate={handleNavigate}
        />

        {/* Dynamic sidebar */}
        <Sidebar 
          onLogout={handleLogout} 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
          activeRoute={activeRoute}
          onNavigate={handleNavigate}
        />

        {/* Content body layout */}
        <div className="p-4 md:pl-72 pt-20 pb-10">
          <main className="mx-auto max-w-7xl px-2 sm:px-6 py-4">
            {renderViewContent()}
          </main>
        </div>

      </div>
    );
  }

  // Public layouts fallback
  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans">
      {renderViewContent()}
    </div>
  );
}
