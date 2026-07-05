import { useState, useRef, useEffect } from "react";
import { Send, Terminal, Loader2, Copy, Check, HelpCircle, AlertCircle } from "lucide-react";
import { User } from "../types";

interface Message {
  sender: "user" | "ai";
  text: string;
  remediations?: string[];
}

interface AIChatProps {
  user: User | null;
  token: string;
}

export default function AIChat({ user, token }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "SecOps Assistant fully online. I have access to your TLS metrics, website configurations, and login audit records. How can I help protect your infrastructure today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const suggestedPrompts = [
    "Run a vulnerability header audit on current sites.",
    "Show anomalous geolocational login attempts.",
    "Explain Clickjacking mitigation headers.",
    "Assess SSL/TLS certificate expiry risks."
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Format chat history for backend context
    const historyPayload = messages.map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: textToSend, history: historyPayload })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI agent failed to generate reasoning.");
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.message,
          remediations: data.remediations || []
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `🚨 System Error: Unable to complete AI inference. Details: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] text-left gap-4">
      
      {/* Upper Title and Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/60 pb-4 shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Terminal className="h-6 w-6 text-blue-400" />
            <span>AI Autonomous Chat Brain</span>
          </h1>
          <p className="text-xs text-slate-500">
            Consult the centralized Gemini intelligence core for complex threat mitigations and real-time posture assessments.
          </p>
        </div>
      </div>

      {/* Main chat interface grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        
        {/* Suggested Prompt Cards Sidebar Panel */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 rounded-2xl bg-[#0D1117] border border-slate-800/50 p-5 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider border-b border-slate-800/60 pb-2">
            <HelpCircle className="h-4 w-4" />
            <span>Operational Templates</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Click any threat matrix template to feed it directly to the active AI core:
          </p>
          <div className="space-y-2 mt-2">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSendMessage(prompt)}
                className="w-full text-left text-xs text-slate-400 hover:text-blue-400 rounded-xl bg-slate-900/40 hover:bg-blue-950/20 border border-slate-800 hover:border-blue-500/20 p-3 transition-all duration-300 font-sans leading-snug cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Feed Box */}
        <div className="lg:col-span-3 flex flex-col rounded-2xl bg-[#0D1117] border border-slate-800/50 min-h-0 flex-1 overflow-hidden">
          
          {/* Scrollable messages container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 max-w-3xl ${m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`h-8 w-8 rounded-full shrink-0 border flex items-center justify-center text-xs font-mono ${
                  m.sender === "user" 
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400" 
                    : "bg-indigo-500/10 border-indigo-400/30 text-indigo-400"
                }`}>
                  {m.sender === "user" ? "U" : "AI"}
                </div>

                {/* Message Speech bubble */}
                <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed font-sans border shadow-md relative group ${
                  m.sender === "user" 
                    ? "bg-blue-950/20 border-blue-500/10 text-slate-100" 
                    : "bg-slate-900/50 border-slate-800 text-slate-300"
                }`}>
                  
                  {/* Text Content */}
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Remediation steps checklists if supplied */}
                  {m.remediations && m.remediations.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-slate-800/60 pt-2 text-left">
                      <span className="block text-[10px] font-mono text-blue-400 uppercase tracking-widest font-semibold">
                        Suggested Remediation Runbook:
                      </span>
                      {m.remediations.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-2 text-blue-300 bg-blue-950/10 rounded-xl px-2.5 py-1.5 text-[11px] border border-blue-500/5 font-mono">
                          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Copy Button Overlay */}
                  <button
                    onClick={() => handleCopyMessage(m.text, idx)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    title="Copy payload response to clipboard"
                  >
                    {copiedId === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            ))}

            {/* Simulated Typist Cursor Loader */}
            {loading && (
              <div className="flex gap-3 mr-auto">
                <div className="h-8 w-8 rounded-full shrink-0 border bg-indigo-500/10 border-indigo-400/30 text-indigo-400 flex items-center justify-center text-xs font-mono">
                  AI
                </div>
                <div className="rounded-2xl px-4 py-3 bg-slate-900/50 border border-slate-800 flex items-center gap-1.5 text-xs text-indigo-400 font-mono">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                  <span>Sentinel brain analyzing threat intelligence database...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form text input console bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }} 
            className="p-3.5 border-t border-slate-800/60 shrink-0 bg-[#080B12] flex gap-2"
          >
            <input
              type="text"
              disabled={loading}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query cyber postures, request website headers scans, or review intrusion steps..."
              className="flex-1 rounded-xl bg-slate-900 border border-slate-800 focus:border-blue-500/50 px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all font-sans"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              id="btn-ai-send"
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-5 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
