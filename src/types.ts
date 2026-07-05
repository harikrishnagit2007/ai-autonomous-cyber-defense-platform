export interface User {
  id: string;
  email: string;
  fullName: string;
  company: string;
  avatarUrl: string;
  settings?: UserSettings;
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

export interface DashboardSummary {
  globalScore: number;
  healthStatus: "healthy" | "warning" | "critical";
  activeAlertsCount: number;
  protectedWebsitesCount: number;
  criticalIssues: string[];
  threatTrends: { date: string; blockedAttempts: number; riskIndex: number }[];
  recentActivity: LoginHistory[];
}

export interface AIResponse {
  message: string;
  intent: string;
  remediations: string[];
  actionLink?: string;
  actionText?: string;
}
