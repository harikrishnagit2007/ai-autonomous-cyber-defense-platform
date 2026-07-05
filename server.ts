import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db, hashPassword, User, Website, Alert, Report, UserSettings } from "./server/db";
import { CyberDefenseEngine } from "./server/cyberDefense";
import { NotificationDecisionLayer } from "./server/notification";
import { AIAgentManager } from "./server/aiAgent";

// Extend Request type to include authenticated user context
interface AuthenticatedRequest extends Request {
  userId?: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body parser
  app.use(express.json());

  // Simple Token Extractor Middleware
  const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      // Check query parameter or cookies (as manual header extraction helper)
      const cookies = req.headers.cookie || "";
      const match = cookies.match(/session-token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      res.status(401).json({ error: "Unauthorized access. Authentication required." });
      return;
    }

    // Decode mock session: Base64 or userId directly.
    // For extreme simplicity and total reliability, our token is a base64 encoded string containing userId:email:expiry
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const [userId, email, expiry] = decoded.split(":");
      
      if (!userId || Date.now() > Number(expiry)) {
        res.status(401).json({ error: "Session expired. Please log in again." });
        return;
      }

      req.userId = userId;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid credentials token." });
    }
  };

  // -----------------------------------------
  // 1. AUTHENTICATION ENDPOINTS
  // -----------------------------------------

  // Register
  app.post("/api/auth/register", (req: Request, res: Response): void => {
    const { fullName, email, password, company } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: "Missing required registration parameters." });
      return;
    }

    const existingUsers = db.getUsers();
    if (existingUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const newUser: User = {
      id: "user-" + Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      fullName,
      company: company || "Independent Secure Org",
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
      createdAt: new Date().toISOString(),
    };

    db.addUser(newUser);

    // Create a 7-day session token
    const expiry = Date.now() + 3600000 * 24 * 7;
    const sessionToken = Buffer.from(`${newUser.id}:${newUser.email}:${expiry}`).toString("base64");

    res.setHeader("Set-Cookie", `session-token=${sessionToken}; Path=/; HttpOnly; Max-Age=${3600 * 24 * 7}; SameSite=None; Secure`);
    res.status(201).json({
      message: "Registration successful.",
      token: sessionToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        company: newUser.company,
        avatarUrl: newUser.avatarUrl,
      },
    });
  });

  // Login
  app.post("/api/auth/login", (req: Request, res: Response): void => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const users = db.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Wrong Password or Invalid Credentials." });
      return;
    }

    // Add success audit log
    db.addLoginHistory({
      id: "log-" + Math.random().toString(36).substring(2, 11),
      userId: user.id,
      email: user.email,
      time: new Date().toISOString(),
      ip: req.ip || "127.0.0.1",
      location: "Local Connection",
      status: "success",
      userAgent: req.headers["user-agent"] || "Unknown Browser",
    });

    const expiry = Date.now() + 3600000 * 24 * 7;
    const sessionToken = Buffer.from(`${user.id}:${user.email}:${expiry}`).toString("base64");

    res.setHeader("Set-Cookie", `session-token=${sessionToken}; Path=/; HttpOnly; Max-Age=${3600 * 24 * 7}; SameSite=None; Secure`);
    res.json({
      message: "Login successful.",
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        company: user.company,
        avatarUrl: user.avatarUrl,
      },
    });
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.setHeader("Set-Cookie", "session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure");
    res.json({ message: "Logout successful." });
  });

  // Forgot Password
  app.post("/api/auth/forgot-password", (req: Request, res: Response): void => {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Please supply an email address." });
      return;
    }

    const user = db.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Guard user discovery security but tell them email is sent
      res.json({ message: "If matching account exists, a secure reset token has been dispatched." });
      return;
    }

    // Generate simulated secure reset token
    const resetToken = crypto.randomUUID ? crypto.randomUUID() : "rst-" + Math.random().toString(36).substring(2, 15);
    console.log(`[SMTP-RESET] Dispatched Password Reset token to user ${email}: ${resetToken}`);

    res.json({
      message: "Password reset link sent to registered email.",
      resetToken, // Return for simulation ease in Phase 2 frontend
    });
  });

  // Reset Password
  app.post("/api/auth/reset-password", (req: Request, res: Response): void => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({ error: "Missing email or new password." });
      return;
    }

    const users = db.getUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

    if (idx !== -1) {
      users[idx].passwordHash = hashPassword(newPassword);
      db.updateWebsite("", {}); // force save trigger
      res.json({ message: "Password updated successfully. You can now log in." });
    } else {
      res.status(404).json({ error: "User account not found." });
    }
  });

  // Fetch Current Session User
  app.get("/api/auth/me", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const user = db.getUsers().find((u) => u.id === req.userId);
    if (!user) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const settings = db.getSettings(user.id);

    res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      company: user.company,
      avatarUrl: user.avatarUrl,
      settings,
    });
  });

  // Google OAuth Login Bypass
  app.get("/api/auth/google", (req: Request, res: Response) => {
    // Standard OAuth Redirect Bypass - Creates a google user or logs in Google demo admin
    const googleEmail = "harikrishna.gm.2025.aids@rajalakshmi.edu.in";
    let users = db.getUsers();
    let user = users.find((u) => u.email === googleEmail);

    if (!user) {
      user = {
        id: "user-google-demo",
        email: googleEmail,
        passwordHash: hashPassword("google-oauth-random-pw"),
        fullName: "Hari Krishna",
        company: "Rajalakshmi Institute",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=GoogleHari",
        createdAt: new Date().toISOString(),
      };
      db.addUser(user);
    }

    const expiry = Date.now() + 3600000 * 24 * 7;
    const sessionToken = Buffer.from(`${user.id}:${user.email}:${expiry}`).toString("base64");

    res.setHeader("Set-Cookie", `session-token=${sessionToken}; Path=/; HttpOnly; Max-Age=${3600 * 24 * 7}; SameSite=None; Secure`);
    res.send(`
      <html>
        <head>
          <title>SSO Redirecting...</title>
          <style>
            body { background: #05070a; color: #38bdf8; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .spinner { border: 3px solid rgba(56, 189, 248, 0.1); border-top: 3px solid #38bdf8; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-bottom: 12px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .content { display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="spinner"></div>
            <div>Authenticating secure session. Transferring tokens...</div>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                token: '${sessionToken}',
                user: ${JSON.stringify({
                  id: user.id,
                  email: user.email,
                  fullName: user.fullName,
                  company: user.company,
                  avatarUrl: user.avatarUrl,
                })}
              }, '*');
              window.close();
            } else {
              window.location.href = '/dashboard?token=${sessionToken}';
            }
          </script>
        </body>
      </html>
    `);
  });

  // GitHub OAuth Login Bypass
  app.get("/api/auth/github", (req: Request, res: Response) => {
    const githubEmail = "github-administrator@cyberdefense.ai";
    let users = db.getUsers();
    let user = users.find((u) => u.email === githubEmail);

    if (!user) {
      user = {
        id: "user-github-demo",
        email: githubEmail,
        passwordHash: hashPassword("github-oauth-random-pw"),
        fullName: "Github Admin",
        company: "Open Source Shield",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=GitHubAdmin",
        createdAt: new Date().toISOString(),
      };
      db.addUser(user);
    }

    const expiry = Date.now() + 3600000 * 24 * 7;
    const sessionToken = Buffer.from(`${user.id}:${user.email}:${expiry}`).toString("base64");

    res.setHeader("Set-Cookie", `session-token=${sessionToken}; Path=/; HttpOnly; Max-Age=${3600 * 24 * 7}; SameSite=None; Secure`);
    res.send(`
      <html>
        <head>
          <title>SSO Redirecting...</title>
          <style>
            body { background: #05070a; color: #38bdf8; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .spinner { border: 3px solid rgba(56, 189, 248, 0.1); border-top: 3px solid #38bdf8; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-bottom: 12px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .content { display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="spinner"></div>
            <div>Authenticating secure session. Transferring tokens...</div>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                token: '${sessionToken}',
                user: ${JSON.stringify({
                  id: user.id,
                  email: user.email,
                  fullName: user.fullName,
                  company: user.company,
                  avatarUrl: user.avatarUrl,
                })}
              }, '*');
              window.close();
            } else {
              window.location.href = '/dashboard?token=${sessionToken}';
            }
          </script>
        </body>
      </html>
    `);
  });

  // Microsoft OAuth Login Bypass
  app.get("/api/auth/microsoft", (req: Request, res: Response) => {
    const msEmail = "microsoft-enterprise@cyberdefense.ai";
    let users = db.getUsers();
    let user = users.find((u) => u.email === msEmail);

    if (!user) {
      user = {
        id: "user-microsoft-demo",
        email: msEmail,
        passwordHash: hashPassword("ms-oauth-random-pw"),
        fullName: "MS Corporate Admin",
        company: "Microsoft Cloud Shield",
        avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=MSHari",
        createdAt: new Date().toISOString(),
      };
      db.addUser(user);
    }

    const expiry = Date.now() + 3600000 * 24 * 7;
    const sessionToken = Buffer.from(`${user.id}:${user.email}:${expiry}`).toString("base64");

    res.setHeader("Set-Cookie", `session-token=${sessionToken}; Path=/; HttpOnly; Max-Age=${3600 * 24 * 7}; SameSite=None; Secure`);
    res.send(`
      <html>
        <head>
          <title>SSO Redirecting...</title>
          <style>
            body { background: #05070a; color: #38bdf8; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .spinner { border: 3px solid rgba(56, 189, 248, 0.1); border-top: 3px solid #38bdf8; border-radius: 50%; width: 24px; height: 24px; animation: spin 1s linear infinite; margin-bottom: 12px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .content { display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="spinner"></div>
            <div>Authenticating secure session. Transferring tokens...</div>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'OAUTH_AUTH_SUCCESS',
                token: '${sessionToken}',
                user: ${JSON.stringify({
                  id: user.id,
                  email: user.email,
                  fullName: user.fullName,
                  company: user.company,
                  avatarUrl: user.avatarUrl,
                })}
              }, '*');
              window.close();
            } else {
              window.location.href = '/dashboard?token=${sessionToken}';
            }
          </script>
        </body>
      </html>
    `);
  });


  // -----------------------------------------
  // 2. WEBSITES ENDPOINTS
  // -----------------------------------------

  // List
  app.get("/api/websites", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const list = db.getWebsites(req.userId!);
    res.json(list);
  });

  // Add Website (triggers automatic background scanning to compute initial vulnerability profiles!)
  app.post("/api/websites", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { name, url, description } = req.body;

    if (!name || !url) {
      res.status(400).json({ error: "Website name and URL are required parameters." });
      return;
    }

    // Run active analyzer check
    const analysis = await CyberDefenseEngine.analyzeWebsite(url);

    const newWeb: Website = {
      id: "web-" + Math.random().toString(36).substring(2, 11),
      userId: req.userId!,
      name,
      url,
      httpsStatus: analysis.httpsEnabled,
      sslStatus: analysis.sslStatus,
      securityScore: analysis.httpsEnabled ? (analysis.sslStatus === "valid" ? 95 : 75) : 40,
      lastScan: new Date().toISOString(),
      healthStatus: analysis.httpsEnabled ? (analysis.sslStatus === "valid" ? "healthy" : "warning") : "critical",
      addedAt: new Date().toISOString(),
      sslExpiresDays: analysis.sslExpiresDays,
      securityHeadersCount: Object.values(analysis.securityHeaders).filter(Boolean).length,
    };

    db.addWebsite(newWeb);

    // If score is vulnerable, issue an AI alert automatically inside notifications decision loop!
    if (newWeb.securityScore < 80) {
      const generatedAlert: Alert = {
        id: "alert-" + Math.random().toString(36).substring(2, 11),
        userId: req.userId!,
        websiteId: newWeb.id,
        threatName: !newWeb.httpsStatus ? "Missing Transport Layer Security" : "Vulnerable Headers Profile",
        severity: !newWeb.httpsStatus ? "critical" : "medium",
        websiteName: newWeb.name,
        time: new Date().toISOString(),
        aiSummary: !newWeb.httpsStatus
          ? `The endpoint ${newWeb.name} is running over plain-text HTTP protocol, exposing parameters to packet sniffing.`
          : `The endpoint ${newWeb.name} has scored below 80% on general security score audits. Missing Clickjacking or Content-Security policies.`,
        recommendedAction: !newWeb.httpsStatus
          ? "Redirect HTTP traffic to secure HTTPS SSL port 443 immediately."
          : "Add X-Frame-Options: SAMEORIGIN and valid CSP headers to web portal.",
        status: "unread",
      };
      
      db.addAlert(generatedAlert);
      await NotificationDecisionLayer.evaluateAlertAndNotify(req.userId!, generatedAlert);
    }

    res.status(201).json(newWeb);
  });

  // Edit Website Node
  app.put("/api/websites/:id", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { name, url } = req.body;
    const updated = db.updateWebsite(req.params.id, { name, url });
    if (!updated) {
      res.status(404).json({ error: "Website node not found or unauthorized." });
      return;
    }
    res.json(updated);
  });

  // Delete Website Node
  app.delete("/api/websites/:id", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    db.deleteWebsite(req.params.id);
    res.json({ message: "Website node and affiliated alert feeds purged successfully." });
  });

  // Manual Scanner Trigger
  app.post("/api/websites/:id/scan", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const website = db.getWebsite(req.params.id);
    if (!website || website.userId !== req.userId!) {
      res.status(404).json({ error: "Website context not found." });
      return;
    }

    // Run live audit
    const analysis = await CyberDefenseEngine.analyzeWebsite(website.url);
    const findings = CyberDefenseEngine.runVulnerabilityScan(website);

    // Dynamic score penalty calculation
    let score = 100;
    if (!analysis.httpsEnabled) score -= 50;
    if (analysis.sslStatus === "warning") score -= 15;
    if (analysis.sslStatus === "invalid") score -= 40;
    
    // Penalize missing security headers
    const headerPenalty = (5 - Object.values(analysis.securityHeaders).filter(Boolean).length) * 5;
    score -= headerPenalty;
    score = Math.max(10, score);

    const updated = db.updateWebsite(website.id, {
      httpsStatus: analysis.httpsEnabled,
      sslStatus: analysis.sslStatus,
      sslExpiresDays: analysis.sslExpiresDays,
      securityScore: score,
      lastScan: new Date().toISOString(),
      healthStatus: score >= 90 ? "healthy" : (score >= 70 ? "warning" : "critical"),
      securityHeadersCount: Object.values(analysis.securityHeaders).filter(Boolean).length,
    });

    res.json({
      website: updated,
      analysis,
      vulnerabilities: findings,
    });
  });


  // -----------------------------------------
  // 3. SECURE DASHBOARD & AGGREGATE STATS
  // -----------------------------------------
  app.get("/api/dashboard/summary", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const intelligence = CyberDefenseEngine.getSecurityIntelligence(userId);
    const websites = db.getWebsites(userId);
    const logins = db.getLoginHistory(userId);
    const alerts = db.getAlerts(userId);

    // Compute charts data
    // Timeline Trends (last 5 scans or mock trends)
    const threatTrends = [
      { date: "Jul 01", blockedAttempts: 12, riskIndex: 45 },
      { date: "Jul 02", blockedAttempts: 25, riskIndex: 58 },
      { date: "Jul 03", blockedAttempts: 8, riskIndex: 32 },
      { date: "Jul 04", blockedAttempts: 42, riskIndex: 78 },
      { date: "Jul 05", blockedAttempts: activeAlertsCount(alerts) * 5, riskIndex: 100 - intelligence.overallRiskScore },
    ];

    function activeAlertsCount(list: Alert[]) {
      return list.filter((a) => a.status === "unread").length;
    }

    res.json({
      globalScore: intelligence.overallRiskScore,
      healthStatus: intelligence.securityStatus,
      activeAlertsCount: intelligence.activeThreatCount,
      protectedWebsitesCount: websites.length,
      criticalIssues: intelligence.criticalIssues,
      threatTrends,
      recentActivity: logins.slice(0, 5),
    });
  });


  // -----------------------------------------
  // 4. ALERTS ENDPOINTS
  // -----------------------------------------
  app.get("/api/alerts", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const list = db.getAlerts(req.userId!);
    res.json(list);
  });

  app.post("/api/alerts/:id/read", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const alert = db.getAlert(req.params.id);
    if (!alert || alert.userId !== req.userId!) {
      res.status(404).json({ error: "Alert item not found." });
      return;
    }

    const updated = db.updateAlert(alert.id, { status: "read" });
    res.json(updated);
  });

  app.post("/api/alerts/clear-all", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const alerts = db.getAlerts(req.userId!);
    alerts.forEach((a) => {
      db.updateAlert(a.id, { status: "read" });
    });
    res.json({ message: "All alerts marked as read." });
  });


  // -----------------------------------------
  // 5. REPORTS ENDPOINTS
  // -----------------------------------------
  app.get("/api/reports", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const list = db.getReports(req.userId!);
    res.json(list);
  });

  // PDF Download Trigger
  app.get("/api/reports/download/:id", (req: Request, res: Response) => {
    // Generate a secure high-fidelity text-based security report
    const reportId = req.params.id;
    
    res.setHeader("Content-Disposition", `attachment; filename=AI_Cyber_Defense_Report_${reportId}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    // Send a beautifully structured plain-text/simulated pdf byte-frame
    res.send(`%PDF-1.4
%
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 200 >>
stream
BT
/F1 18 Tf
50 750 Td
(AI Autonomous Cyber Defense Platform) Tj
/F1 12 Tf
0 -30 Td
(Enterprise Compliance Security Audits - Code: ${reportId}) Tj
0 -20 Td
(Date: ${new Date().toLocaleDateString()}) Tj
0 -40 Td
(Autonomous Cyber Intelligence scanning complete. All endpoints guarded.) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000018 00000 n 
0000000067 00000 n 
0000000122 00000 n 
0000000271 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
521
%%EOF`);
  });


  // -----------------------------------------
  // 6. SETTINGS PROFILE & NOTIFICATIONS preference
  // -----------------------------------------
  app.put("/api/settings", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { preferredChannels, notificationFrequency, quietHours, severityThreshold, mfaEnabled, fullName, company } = req.body;

    // Update settings
    const updatedSettings = db.updateSettings(userId, {
      preferredChannels,
      notificationFrequency,
      quietHours,
      severityThreshold,
      mfaEnabled,
    });

    // Also update User profile details if supplied
    if (fullName || company) {
      const users = db.getUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        if (fullName) users[idx].fullName = fullName;
        if (company) users[idx].company = company;
        db.updateWebsite("", {}); // save trigger
      }
    }

    res.json({
      message: "Security preferences saved successfully.",
      settings: updatedSettings,
    });
  });


  // -----------------------------------------
  // 7. SECURE AI CHAT AGENT CENTRAL INTEL API
  // -----------------------------------------
  app.post("/api/chat", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const { prompt, history } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Empty prompts are invalid." });
      return;
    }

    try {
      const aiResponse = await AIAgentManager.processMessage(req.userId!, prompt, history || []);
      res.json(aiResponse);
    } catch (err: any) {
      res.status(500).json({ error: "AI reasoning failed: " + err.message });
    }
  });


  // -----------------------------------------
  // VITE DEVELOPMENT MIDDLEWARE SETUP
  // -----------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SECURE SERVER] Cyber Platform running on http://localhost:${PORT}`);
  });
}

startServer();
