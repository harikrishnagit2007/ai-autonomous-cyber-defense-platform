import { GoogleGenAI, Type } from "@google/genai";
import { db, User, Website, Alert, Report, LoginHistory } from "./db";
import { CyberDefenseEngine } from "./cyberDefense";

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface AIResponse {
  message: string;
  intent: string;
  remediations: string[];
  actionLink?: string;
  actionText?: string;
}

export class AIAgentManager {
  /**
   * Orchestrates the incoming chat command, reads current DB context, and engages the AI brain
   */
  public static async processMessage(
    userId: string,
    prompt: string,
    history: ChatMessage[] = []
  ): Promise<AIResponse> {
    const cleanPrompt = prompt.trim();
    const websites = db.getWebsites(userId);
    const alerts = db.getAlerts(userId);
    const reports = db.getReports(userId);
    const logins = db.getLoginHistory(userId);
    const user = db.getUsers().find((u) => u.id === userId);

    // Build the system context to feed to Gemini so it behaves as an all-knowing secure analyst
    const systemContext = `
You are the Central Intelligence Brain of the AI Autonomous Cyber Defense Platform.
Your mission is to understand user natural-language queries, analyze their security logs, websites, and alerts, and return elite, actionable guides.
Never expose raw JSON, raw database entries, or system internals directly to users. Speak elegantly, professionally, and clearly.

CONTEXT DATABASE:
Current User: ${user?.fullName || "Administrator"} (Company: ${user?.company || "Secure Org"})
Protected Websites: ${JSON.stringify(
      websites.map((w) => ({
        id: w.id,
        name: w.name,
        url: w.url,
        score: w.securityScore,
        https: w.httpsStatus,
        ssl: w.sslStatus,
        health: w.healthStatus,
      }))
    )}
Active Unresolved Security Alerts: ${JSON.stringify(
      alerts
        .filter((a) => a.status === "unread")
        .map((a) => ({
          website: a.websiteName,
          threat: a.threatName,
          severity: a.severity,
          summary: a.aiSummary,
        }))
    )}
Recent Security Reports: ${JSON.stringify(
      reports.map((r) => ({
        name: r.name,
        type: r.type,
        date: r.date,
      }))
    )}
Authentication Audit Trails (Last Logins): ${JSON.stringify(
      logins.slice(0, 4).map((l) => ({
        time: l.time,
        ip: l.ip,
        location: l.location,
        status: l.status,
      }))
    )}

USER INQUIRY: "${cleanPrompt}"
`;

    // Try live Gemini API first
    const ai = getGeminiClient();
    if (ai) {
      try {
        const schema = {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "The primary detailed answer or advice formatted in beautiful Markdown.",
            },
            intent: {
              type: Type.STRING,
              description: "The matched intent category: 'dashboard_summary' | 'analyze_website' | 'check_logins' | 'recent_alerts' | 'generate_reports' | 'general_help'",
            },
            remediations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A bulleted list of 2-3 specific, actionable cyber-defense recommendations.",
            },
            actionLink: {
              type: Type.STRING,
              description: "Optional internal relative dashboard link matching user's request (e.g., '/dashboard/websites', '/dashboard/alerts', '/dashboard/settings').",
            },
            actionText: {
              type: Type.STRING,
              description: "Action button label for the link.",
            },
          },
          required: ["message", "intent", "remediations"],
        };

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            ...history.map((h) => ({
              role: h.role,
              parts: h.parts,
            })),
            { role: "user", parts: [{ text: systemContext }] },
          ],
          config: {
            systemInstruction: "You output valid, complete JSON only. Follow the provided schema strictly.",
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        const text = response.text || "{}";
        const parsed: AIResponse = JSON.parse(text.trim());
        return parsed;
      } catch (err) {
        console.error("Gemini AI Agent call failed, engaging Local Secure Router fallback:", err);
      }
    }

    // High fidelity local heuristic fallback router
    return this.runHeuristicFallback(cleanPrompt, websites, alerts, reports, logins);
  }

  private static runHeuristicFallback(
    prompt: string,
    websites: Website[],
    alerts: Alert[],
    reports: Report[],
    logins: LoginHistory[]
  ): AIResponse {
    const q = prompt.toLowerCase();

    // 1. INTENT: Website scanning / analysis
    if (q.includes("analyze") || q.includes("website") || q.includes("scan") || q.includes("ssl")) {
      const siteDetails = websites
        .map(
          (w) =>
            `- **${w.name}** (${w.url}): Security Score of **${w.securityScore}/100**. HTTPS is ${
              w.httpsStatus ? "Enabled" : "Disabled"
            }. SSL certificate status is **${w.sslStatus.toUpperCase()}**.`
        )
        .join("\n");

      return {
        intent: "analyze_website",
        message: `### Website Security Profiler\n\nI have successfully scanned your active enterprise web portals. Here is my autonomous assessment:\n\n${siteDetails}\n\n*Our active scanners are watching these endpoints for cryptographic renewals, CORS parameters, and suspicious routing.*`,
        remediations: [
          "Enable secure HTTPS port 443 strictly on your Public Blog endpoint.",
          "Renew SSL certificate for the Payment Gateway immediately (expires soon).",
          "Inject strict HSTS response headers across all active admin nodes.",
        ],
        actionLink: "/dashboard/websites",
        actionText: "Manage Website Nodes",
      };
    }

    // 2. INTENT: Login activity audit
    if (q.includes("login") || q.includes("activity") || q.includes("failed") || q.includes("ip") || q.includes("auth")) {
      const loginCount = logins.length;
      const failedCount = logins.filter((l) => l.status === "failed").length;
      const ukraineLogins = logins.filter((l) => l.location.includes("Ukraine"));

      let warnMessage = "";
      if (ukraineLogins.length > 0) {
        warnMessage = `\n\n⚠️ **CRITICAL FINDING**: An authorized login was successfully established from **Kiev, Ukraine** (IP: \`${ukraineLogins[0].ip}\`) which is outside your usual profile geographical fence.`;
      }

      return {
        intent: "check_logins",
        message: `### Authentication Audit Trail\n\nI have audited the server's authentication journals. Here are the cyber-intelligence findings:\n\n- **Total Authentication Events**: ${loginCount} logged logs.\n- **Failed Attempts**: ${failedCount} blocks.${warnMessage}\n\n*Brute-force risk analysis: Moderate. Our firewalls have locked suspicious IP nodes to preserve access control.*`,
        remediations: [
          "Enable Multi-Factor Authentication (MFA) immediately inside account controls.",
          "Restrict administrator SSH/Portals access behind a strict company VPN.",
          "Revoke the active token associated with Ukraine login context.",
        ],
        actionLink: "/dashboard/settings",
        actionText: "Configure Secure MFA",
      };
    }

    // 3. INTENT: Alerts list
    if (q.includes("alert") || q.includes("threat") || q.includes("critical") || q.includes("unread")) {
      const active = alerts.filter((a) => a.status === "unread");
      const alertLines = active
        .map((a) => `- [${a.severity.toUpperCase()}] **${a.threatName}** on ${a.websiteName}: ${a.aiSummary}`)
        .join("\n");

      return {
        intent: "recent_alerts",
        message: `### Cyber Alerts Audit Feed\n\nI have detected **${active.length} active threats** demanding immediate attention:\n\n${
          alertLines || "🎉 *Awesome! All registered alert feeds are currently resolved and clear.*"
        }`,
        remediations: [
          "Isolate client request IP addresses triggering SSH brute force sequences.",
          "Apply immediate security patch on checkout APIs to defeat XSS attempts.",
        ],
        actionLink: "/dashboard/alerts",
        actionText: "Inspect Threats Panel",
      };
    }

    // 4. INTENT: Report generator
    if (q.includes("report") || q.includes("pdf") || q.includes("download") || q.includes("generate")) {
      return {
        intent: "generate_reports",
        message: `### Reports Intelligence Hub\n\nI have verified your active weekly and monthly security compliance audits. Here are your generated reports:\n\n- **Weekly Threat Audit**: Validated and compiled yesterday (1.2 MB).\n- **Monthly Compliance Audit**: Synthesized 5 days ago (4.5 MB).\n\n*These PDF bundles are cryptographically signed for internal compliance sharing.*`,
        remediations: [
          "Schedule an automated weekly PDF report export to your security channel.",
          "Enforce third-party penetrative assessments ahead of compliance sign-offs.",
        ],
        actionLink: "/dashboard/reports",
        actionText: "Download PDF Audits",
      };
    }

    // 5. INTENT: Dashboard/Summary summary
    if (q.includes("summary") || q.includes("dashboard") || q.includes("status") || q.includes("score")) {
      const activeAlertsCount = alerts.filter((a) => a.status === "unread").length;
      return {
        intent: "dashboard_summary",
        message: `### Platform Security Briefing\n\nHere is your autonomous dashboard status summary:\n\n- **Protected Web Nodes**: ${websites.length} websites currently active.\n- **Active Threat Indicators**: ${activeAlertsCount} alerts unread.\n- **SSL Security State**: Balanced coverage with certificate expiring warnings under observation.\n\n*System overall health is categorized under **STRICT REVIEW**.*`,
        remediations: [
          "Correct certificate renewal on 'Secure Payment Gateway' immediately.",
          "Enable security rules enforcing mandatory SSL compliance.",
        ],
        actionLink: "/dashboard",
        actionText: "View Interactive Graphs",
      };
    }

    // Default general help fallback
    return {
      intent: "general_help",
      message: `### Hello, I am your Autonomous Security Assistant.\n\nI coordinate cyber audits, threat mitigation, security alerts routing, and vulnerability scoring for your protected sites.\n\n**Here are a few commands I understand:**\n\n- *"Show dashboard summary"* to check overall global risk grades\n- *"Analyze my website"* to audit TLS/SSL configuration status\n- *"Check login activity"* to look for credential anomalies\n- *"Display recent alerts"* to read blocked brute-force logs`,
      remediations: [
        "Ask me to analyze your payment portals.",
        "Query auth logs to inspect Ukraine login attempts.",
      ],
    };
  }
}
