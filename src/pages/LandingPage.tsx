import { Shield, Sparkles, Terminal, Activity, Globe, Eye, FileSpreadsheet, BellRing, ChevronRight } from "lucide-react";

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      title: "Autonomous AI Agent",
      desc: "Our LLM-driven central brain detects intents, coordinates network scans, and provides contextual mitigation steps.",
      icon: Terminal,
      glow: "border-slate-800/60 hover:border-blue-500/30"
    },
    {
      title: "Live Monitoring Nodes",
      desc: "Instant HTTP checks and TLS validation processes, continuously tracking website availability and configurations.",
      icon: Globe,
      glow: "border-slate-800/60 hover:border-blue-500/30"
    },
    {
      title: "Vulnerability Profiler",
      desc: "Proactively inspects target response headers (HSTS, CSP, X-Frame) to detect compliance vulnerabilities.",
      icon: Eye,
      glow: "border-slate-800/60 hover:border-blue-500/30"
    },
    {
      title: "Secure Threat Intelligence",
      desc: "Correlates authentication history to highlight intrusion sequences, geographical anomalies, and credential sprays.",
      icon: Activity,
      glow: "border-slate-800/60 hover:border-blue-500/30"
    },
    {
      title: "Dynamic Alert Dispatcher",
      desc: "An intelligent notification layer classifying threats into configurable, channel-specific pipelines (SMS, Slack, Teams).",
      icon: BellRing,
      glow: "border-slate-800/60 hover:border-blue-500/30"
    },
    {
      title: "PDF Audit Reports",
      desc: "Automatically synthesizes and signs cryptographically secure weekly and monthly cyber threat summaries.",
      icon: FileSpreadsheet,
      glow: "border-slate-800/60 hover:border-blue-500/30"
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#05070A] overflow-hidden cyber-grid">
      
      {/* Sticky Top Navigation Bar */}
      <nav className="fixed top-0 left-0 z-50 w-full bg-[#080B12]/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-500" />
            <span className="font-display font-extrabold text-base tracking-wide text-white uppercase">
              CYBER SENTINEL
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-mono tracking-widest text-slate-500 uppercase">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <span className="text-slate-800">|</span>
            <a href="#about" className="hover:text-blue-400 transition-colors">Tech Deck</a>
            <span className="text-slate-800">|</span>
            <span className="text-slate-600 cursor-not-allowed">Pricing (Coming Soon)</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate("login")}
              id="btn-landing-login"
              className="text-xs font-mono uppercase tracking-widest text-slate-400 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => onNavigate("register")}
              id="btn-landing-register"
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-semibold text-xs uppercase tracking-widest px-4 py-2 shadow-lg shadow-blue-600/20 transition-all duration-300 cursor-pointer"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-32 pb-20 md:pt-40 md:pb-32 flex flex-col items-center justify-center text-center">
        
        {/* Floating AI Hologram particle */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/5 blur-[100px] pulse-glow"></div>
        <div className="absolute top-1/3 left-1/4 -z-10 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[80px]"></div>

        {/* Central badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-[10px] font-mono tracking-widest text-blue-400 uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AUTONOMOUS SENTINEL ENGINE v4.2</span>
        </div>

        {/* Main Display Heading */}
        <h1 className="max-w-4xl font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
          AI Autonomous <span className="bg-gradient-to-r from-white via-blue-200 to-blue-500 bg-clip-text text-transparent">Cyber Defense</span> Platform
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-sm sm:text-base md:text-lg text-slate-400 mb-10 leading-relaxed font-sans">
          Protect websites with AI-powered security monitoring, intelligent threat detection, automated cyber defense, real-time alerts, and AI-generated security insights.
        </p>

        {/* Hero CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={() => onNavigate("register")}
            id="btn-hero-cta"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-xs uppercase tracking-widest px-6 py-3.5 shadow-xl shadow-blue-600/10 transition-all duration-300 group cursor-pointer"
          >
            <span>Initialize Sentinel</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => onNavigate("login")}
            className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-display font-bold text-xs uppercase tracking-widest px-6 py-3.5 border border-slate-800 hover:border-slate-700 transition-all duration-300 cursor-pointer"
          >
            Access Dashboard
          </button>
        </div>

      </section>

      {/* Feature Section Grid */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-16 border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
            Autonomous Operational Deck
          </h2>
          <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-2">
            Engineered with deep cybersecurity heuristics
          </p>
        </div>

        {/* Interactive Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx}
                className={`flex flex-col rounded-2xl bg-[#0D1117] p-6 border transition-all duration-300 cursor-default group ${feat.glow}`}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 transition-all duration-300 group-hover:border-blue-500/30 group-hover:bg-blue-950/20">
                  <Icon className="h-5 w-5 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tech Deck Status / Mock Map section */}
      <section id="about" className="mx-auto max-w-7xl px-6 py-12 mb-20">
        <div className="rounded-2xl border border-slate-800/50 bg-[#0D1117] p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-left">
            <span className="text-[10px] font-mono text-blue-400 tracking-widest uppercase font-bold">
              Autonomous Core Architecture
            </span>
            <h3 className="font-display text-xl md:text-2xl font-extrabold text-white uppercase tracking-wide mt-2">
              Neural Network Correlation
            </h3>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed font-sans">
              Our Sentinel platform correlates TLS metrics, XSS heuristics, brute force frequency sequences, and suspicious geolocational logins directly. The results feed into an AI Decision Layer which dynamically determines alerting severities, ensuring zero spam notifications.
            </p>
          </div>
          <div className="w-full lg:w-auto flex flex-wrap gap-4 justify-center font-mono">
            <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 text-center w-28">
              <span className="block text-xl font-extrabold text-blue-400 font-display">94%</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Avg Score</span>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 text-center w-28">
              <span className="block text-xl font-extrabold text-blue-400 font-display">0ms</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Bypass Rate</span>
            </div>
            <div className="rounded-xl bg-slate-900/60 p-4 border border-slate-800 text-center w-28">
              <span className="block text-xl font-extrabold text-blue-400 font-display">&lt;1.2s</span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">Scan SLA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-8 text-center text-xs font-mono text-slate-600 bg-slate-950/30">
        <p>© 2026 CYBER SENTINEL Security Operations. Guarded autonomously in container cluster environment.</p>
      </footer>

    </div>
  );
}
