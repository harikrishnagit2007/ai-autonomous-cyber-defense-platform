import fs from "fs";
import path from "path";
import crypto from "crypto";

const DB_FILE = path.join(process.cwd(), "data", "database.json");

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  company: string;
  avatarUrl: string;
  createdAt: string;
}

export interface Website {
  id: string;
  userId: string;
  name: string;
  url: string;
  httpsStatus: boolean;
  sslStatus: "valid" | "warning" | "invalid";
  securityScore: number;
  lastScan: string;
  healthStatus: "healthy" | "warning" | "critical";
  addedAt: string;
  sslExpiresDays?: number;
  securityHeadersCount?: number;
}

export interface Alert {
  id: string;
  userId: string;
  websiteId: string;
  threatName: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  websiteName: string;
  time: string;
  aiSummary: string;
  recommendedAction: string;
  status: "read" | "unread";
}

export interface Report {
  id: string;
  userId: string;
  type: "weekly" | "monthly" | "website" | "threat" | "vulnerability";
  name: string;
  date: string;
  size: string;
  downloadUrl: string;
}

export interface UserSettings {
  userId: string;
  preferredChannels: {
    email: boolean;
    sms: boolean;
    slack: boolean;
    teams: boolean;
    push: boolean;
  };
  notificationFrequency: "realtime" | "daily" | "weekly";
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  severityThreshold: "low" | "medium" | "high" | "critical";
  languagePreference: string;
  mfaEnabled: boolean;
}

export interface LoginHistory {
  id: string;
  userId: string;
  email: string;
  time: string;
  ip: string;
  location: string;
  status: "success" | "failed";
  userAgent: string;
}

interface DatabaseSchema {
  users: User[];
  websites: Website[];
  alerts: Alert[];
  reports: Report[];
  settings: UserSettings[];
  loginHistory: LoginHistory[];
}

// Simple Helper to hash passwords using SHA-256 securely without complex binaries
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

class DatabaseManager {
  private data: DatabaseSchema = {
    users: [],
    websites: [],
    alerts: [],
    reports: [],
    settings: [],
    loginHistory: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error("Failed to parse database file, starting fresh:", err);
        this.seed();
      }
    } else {
      this.seed();
    }
  }

  private save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
  }

  private seed() {
    console.log("Seeding Database with Premium Security Mock Data...");
    
    // 1. Seed Default Admin User
    const adminUser: User = {
      id: "user-admin-123",
      email: "admin@cyberdefense.ai",
      passwordHash: hashPassword("password123"),
      fullName: "Harikrishna GM",
      company: "Apex Tech Labs",
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Harikrishna",
      createdAt: new Date().toISOString(),
    };

    // 2. Seed Default Settings
    const defaultSettings: UserSettings = {
      userId: adminUser.id,
      preferredChannels: {
        email: true,
        sms: false,
        slack: true,
        teams: false,
        push: true,
      },
      notificationFrequency: "realtime",
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "07:00",
      },
      severityThreshold: "medium",
      languagePreference: "en",
      mfaEnabled: false,
    };

    // 3. Seed Websites
    const websites: Website[] = [
      {
        id: "web-1",
        userId: adminUser.id,
        name: "Enterprise Admin Portal",
        url: "https://admin.apextechlabs.com",
        httpsStatus: true,
        sslStatus: "valid",
        securityScore: 94,
        lastScan: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        healthStatus: "healthy",
        addedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(), // 30 days ago
        sslExpiresDays: 145,
        securityHeadersCount: 5,
      },
      {
        id: "web-2",
        userId: adminUser.id,
        name: "Secure Payment Gateway",
        url: "https://pay.apextechlabs.com",
        httpsStatus: true,
        sslStatus: "warning",
        securityScore: 78,
        lastScan: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
        healthStatus: "warning",
        addedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
        sslExpiresDays: 11, // Warning close expiration
        securityHeadersCount: 3,
      },
      {
        id: "web-3",
        userId: adminUser.id,
        name: "Public Company Blog",
        url: "http://blog.apextechlabs.com",
        httpsStatus: false, // Danger, HTTP only
        sslStatus: "invalid",
        securityScore: 42,
        lastScan: new Date(Date.now() - 3600000 * 12).toISOString(),
        healthStatus: "critical",
        addedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
        sslExpiresDays: 0,
        securityHeadersCount: 1,
      },
    ];

    // 4. Seed Alerts
    const alerts: Alert[] = [
      {
        id: "alert-1",
        userId: adminUser.id,
        websiteId: "web-2",
        threatName: "Brute-force SSH Attempt",
        severity: "critical",
        websiteName: "Secure Payment Gateway",
        time: new Date(Date.now() - 3600000 * 1.5).toISOString(), // 1.5 hours ago
        aiSummary: "Detected 45 repeated failed login attempts from IP 198.51.100.42 targeting admin accounts within 120 seconds.",
        recommendedAction: "IP address has been temporarily blocked. Ensure admin accounts use robust multi-factor authentication (MFA).",
        status: "unread",
      },
      {
        id: "alert-2",
        userId: adminUser.id,
        websiteId: "web-3",
        threatName: "Expired SSL Certificate",
        severity: "high",
        websiteName: "Public Company Blog",
        time: new Date(Date.now() - 3600000 * 8).toISOString(),
        aiSummary: "The SSL certificate for blog.apextechlabs.com has expired, causing browsers to display safety warnings.",
        recommendedAction: "Renew SSL certificate immediately via Let's Encrypt or your domain controller.",
        status: "unread",
      },
      {
        id: "alert-3",
        userId: adminUser.id,
        websiteId: "web-2",
        threatName: "XSS Attempt Blocked",
        severity: "medium",
        websiteName: "Secure Payment Gateway",
        time: new Date(Date.now() - 3600000 * 24).toISOString(),
        aiSummary: "WAF intercepted a malicious Cross-Site Scripting (XSS) payload embedded in the gateway's checkout API query parameter.",
        recommendedAction: "Sanitize URL parameters strictly. Update the Web Application Firewall rule signature database.",
        status: "read",
      },
      {
        id: "alert-4",
        userId: adminUser.id,
        websiteId: "web-1",
        threatName: "Suspicious Login Location",
        severity: "medium",
        websiteName: "Enterprise Admin Portal",
        time: new Date(Date.now() - 3600000 * 48).toISOString(),
        aiSummary: "Successful administrator login detected from Kiev, Ukraine (IP 93.184.216.34) which is highly unusual for this profile.",
        recommendedAction: "Verify session credentials. Revoke active authorization tokens and prompt immediate password reset.",
        status: "read",
      },
    ];

    // 5. Seed Reports
    const reports: Report[] = [
      {
        id: "rep-1",
        userId: adminUser.id,
        type: "weekly",
        name: "Weekly Threat Briefing - Week 27",
        date: new Date(Date.now() - 3600000 * 24).toISOString().split("T")[0],
        size: "1.2 MB",
        downloadUrl: "/api/reports/download/rep-1",
      },
      {
        id: "rep-2",
        userId: adminUser.id,
        type: "monthly",
        name: "June Security Compliance Audit",
        date: new Date(Date.now() - 3600000 * 24 * 5).toISOString().split("T")[0],
        size: "4.5 MB",
        downloadUrl: "/api/reports/download/rep-2",
      },
      {
        id: "rep-3",
        userId: adminUser.id,
        type: "vulnerability",
        name: "Apex Tech Labs Vulnerability Report",
        date: new Date(Date.now() - 3600000 * 24 * 12).toISOString().split("T")[0],
        size: "2.8 MB",
        downloadUrl: "/api/reports/download/rep-3",
      },
    ];

    // 6. Seed Login History
    const loginHistory: LoginHistory[] = [
      {
        id: "log-1",
        userId: adminUser.id,
        email: adminUser.email,
        time: new Date(Date.now() - 3600000 * 1.2).toISOString(),
        ip: "103.45.12.89",
        location: "Chennai, India",
        status: "success",
        userAgent: "Chrome 126.0 / Windows 11",
      },
      {
        id: "log-2",
        userId: adminUser.id,
        email: adminUser.email,
        time: new Date(Date.now() - 3600000 * 3).toISOString(),
        ip: "198.51.100.42",
        location: "Rotterdam, Netherlands",
        status: "failed",
        userAgent: "Go-http-client/1.1",
      },
      {
        id: "log-3",
        userId: adminUser.id,
        email: adminUser.email,
        time: new Date(Date.now() - 3600000 * 3.1).toISOString(),
        ip: "198.51.100.42",
        location: "Rotterdam, Netherlands",
        status: "failed",
        userAgent: "Go-http-client/1.1",
      },
      {
        id: "log-4",
        userId: adminUser.id,
        email: adminUser.email,
        time: new Date(Date.now() - 3600000 * 48).toISOString(),
        ip: "93.184.216.34",
        location: "Kiev, Ukraine",
        status: "success",
        userAgent: "Mozilla/5.0 (compatible; MSIE 10.0)",
      },
    ];

    this.data = {
      users: [adminUser],
      websites,
      alerts,
      reports,
      settings: [defaultSettings],
      loginHistory,
    };

    this.save();
  }

  // API Methods
  public getUsers(): User[] {
    return this.data.users;
  }

  public addUser(user: User) {
    this.data.users.push(user);
    // Initialize default settings too
    const defaultSettings: UserSettings = {
      userId: user.id,
      preferredChannels: {
        email: true,
        sms: false,
        slack: false,
        teams: false,
        push: true,
      },
      notificationFrequency: "realtime",
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "07:00",
      },
      severityThreshold: "medium",
      languagePreference: "en",
      mfaEnabled: false,
    };
    this.data.settings.push(defaultSettings);
    this.save();
  }

  public getWebsites(userId: string): Website[] {
    return this.data.websites.filter((w) => w.userId === userId);
  }

  public getWebsite(id: string): Website | undefined {
    return this.data.websites.find((w) => w.id === id);
  }

  public addWebsite(website: Website) {
    this.data.websites.push(website);
    this.save();
  }

  public updateWebsite(id: string, updated: Partial<Website>) {
    const idx = this.data.websites.findIndex((w) => w.id === id);
    if (idx !== -1) {
      this.data.websites[idx] = { ...this.data.websites[idx], ...updated };
      this.save();
      return this.data.websites[idx];
    }
    return undefined;
  }

  public deleteWebsite(id: string) {
    this.data.websites = this.data.websites.filter((w) => w.id !== id);
    this.data.alerts = this.data.alerts.filter((a) => a.websiteId !== id);
    this.save();
  }

  public getAlerts(userId: string): Alert[] {
    return this.data.alerts.filter((a) => a.userId === userId);
  }

  public getAlert(id: string): Alert | undefined {
    return this.data.alerts.find((a) => a.id === id);
  }

  public addAlert(alert: Alert) {
    this.data.alerts.unshift(alert);
    this.save();
  }

  public updateAlert(id: string, updated: Partial<Alert>) {
    const idx = this.data.alerts.findIndex((a) => a.id === id);
    if (idx !== -1) {
      this.data.alerts[idx] = { ...this.data.alerts[idx], ...updated };
      this.save();
      return this.data.alerts[idx];
    }
    return undefined;
  }

  public getReports(userId: string): Report[] {
    return this.data.reports.filter((r) => r.userId === userId);
  }

  public addReport(report: Report) {
    this.data.reports.unshift(report);
    this.save();
  }

  public getSettings(userId: string): UserSettings | undefined {
    return this.data.settings.find((s) => s.userId === userId);
  }

  public updateSettings(userId: string, updated: Partial<UserSettings>) {
    const idx = this.data.settings.findIndex((s) => s.userId === userId);
    if (idx !== -1) {
      this.data.settings[idx] = { ...this.data.settings[idx], ...updated };
      this.save();
      return this.data.settings[idx];
    } else {
      const newSettings: UserSettings = {
        userId,
        preferredChannels: { email: true, sms: false, slack: false, teams: false, push: true },
        notificationFrequency: "realtime",
        quietHours: { enabled: false, start: "22:00", end: "07:00" },
        severityThreshold: "medium",
        languagePreference: "en",
        mfaEnabled: false,
        ...updated,
      };
      this.data.settings.push(newSettings);
      this.save();
      return newSettings;
    }
  }

  public getLoginHistory(userId: string): LoginHistory[] {
    return this.data.loginHistory.filter((lh) => lh.userId === userId);
  }

  public addLoginHistory(history: LoginHistory) {
    this.data.loginHistory.unshift(history);
    this.save();
  }
}

export const db = new DatabaseManager();
