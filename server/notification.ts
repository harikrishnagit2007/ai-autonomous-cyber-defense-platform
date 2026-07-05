import { db, UserSettings, Alert } from "./db";

export interface NotificationDeliveryReceipt {
  channel: "dashboard" | "email" | "sms" | "push" | "slack" | "teams";
  status: "delivered" | "queued" | "suppressed" | "error";
  details: string;
}

export interface NotificationDecisionResult {
  alertId: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  shouldNotify: boolean;
  suppressionReason?: string;
  dispatchReceipts: NotificationDeliveryReceipt[];
  aiCopyMessage: string;
}

export class NotificationService {
  /**
   * Dispatches a unified notification to specified channels on behalf of the AI Decision System
   */
  public static async deliver(
    userId: string,
    channels: string[],
    subject: string,
    body: string
  ): Promise<NotificationDeliveryReceipt[]> {
    const receipts: NotificationDeliveryReceipt[] = [];

    for (const channel of channels) {
      try {
        switch (channel) {
          case "dashboard":
            // Always recorded in-app as active alerts
            receipts.push({
              channel: "dashboard",
              status: "delivered",
              details: "Notification rendered inside Security Alerts Feed successfully.",
            });
            break;

          case "email":
            // Simulate SMTP Delivery
            console.log(`[SMTP-GATEWAY] Delivering security alert to User: ${userId}`);
            console.log(`[SMTP-GATEWAY] Subject: ${subject}`);
            console.log(`[SMTP-GATEWAY] Body: ${body}`);
            receipts.push({
              channel: "email",
              status: "delivered",
              details: `Secure dispatch successfully sent to administrator SMTP inbox.`,
            });
            break;

          case "sms":
            // Simulate Twilio/SMS Delivery
            console.log(`[SMS-GATEWAY] SMS Outbound queue for User ${userId}`);
            console.log(`[SMS-GATEWAY] Message: ${subject} - ${body.substring(0, 100)}...`);
            receipts.push({
              channel: "sms",
              status: "delivered",
              details: `SMS payload transmitted to telecom carrier queue.`,
            });
            break;

          case "push":
            // Simulate Web Push payload
            console.log(`[PUSH-NOTIFIER] Dispatching Service Worker frame: ${subject}`);
            receipts.push({
              channel: "push",
              status: "delivered",
              details: `WebSocket frame pushed successfully to browser container.`,
            });
            break;

          case "slack":
            // Simulate Slack Incoming Webhook
            console.log(`[SLACK-CONNECTOR] POST JSON block payload to Slack channel:`);
            console.log(`[SLACK-CONNECTOR] Block Text: *${subject}* \n ${body}`);
            receipts.push({
              channel: "slack",
              status: "delivered",
              details: `Post payload parsed and published to Slack workplace channel #cyber-alerts.`,
            });
            break;

          case "teams":
            // Simulate MS Teams Connector
            console.log(`[TEAMS-CONNECTOR] Adaptive Card dispatched to Microsoft Teams webhook: ${subject}`);
            receipts.push({
              channel: "teams",
              status: "delivered",
              details: `Adaptive Card published to Microsoft Teams channel.`,
            });
            break;

          default:
            break;
        }
      } catch (err: any) {
        receipts.push({
          channel: channel as any,
          status: "error",
          details: `Channel failure: ${err.message}`,
        });
      }
    }

    return receipts;
  }
}

export class NotificationDecisionLayer {
  /**
   * Processes a security alert, evaluates quiet hours, checks rules, and delivers corresponding notices
   */
  public static async evaluateAlertAndNotify(userId: string, alert: Alert): Promise<NotificationDecisionResult> {
    const settings = db.getSettings(userId);
    const userChannels = settings?.preferredChannels || {
      email: true,
      sms: false,
      slack: false,
      teams: false,
      push: true,
    };

    // 1. Map alerts severity levels
    const severity = alert.severity;

    // 2. Decide if alert matches user severity threshold
    // Threshold map hierarchy: critical > high > medium > low > info
    const severityHierarchy = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
    const userMinSeverity = settings?.severityThreshold || "medium";

    const alertWeight = severityHierarchy[severity] ?? 2;
    const userThresholdWeight = severityHierarchy[userMinSeverity] ?? 2;

    let shouldNotify = alertWeight >= userThresholdWeight;
    let suppressionReason = "";

    // 3. Evaluate Quiet Hours (if configured)
    if (settings?.quietHours.enabled && shouldNotify) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeString = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

      const { start, end } = settings.quietHours;
      
      const isQuietTime = this.isTimeInRange(currentTimeString, start, end);
      if (isQuietTime) {
        // Suppress push/sms/email unless it is CRITICAL
        if (severity !== "critical") {
          shouldNotify = false;
          suppressionReason = `Suppressed non-critical alert because Quiet Hours are currently active (${start} - ${end}).`;
        }
      }
    }

    // 4. Map active delivery channels according to standard logic and user preference
    const activeDispatchChannels: string[] = ["dashboard"]; // Dashboard alert is always registered

    if (shouldNotify) {
      if (severity === "critical") {
        // Critical alerts go through all user-activated secure channels
        if (userChannels.email) activeDispatchChannels.push("email");
        if (userChannels.sms) activeDispatchChannels.push("sms");
        if (userChannels.push) activeDispatchChannels.push("push");
        if (userChannels.slack) activeDispatchChannels.push("slack");
        if (userChannels.teams) activeDispatchChannels.push("teams");
      } else if (severity === "high") {
        // High alerts send Email + Push + Chat notifications
        if (userChannels.email) activeDispatchChannels.push("email");
        if (userChannels.push) activeDispatchChannels.push("push");
        if (userChannels.slack) activeDispatchChannels.push("slack");
      } else if (severity === "medium") {
        // Medium alerts trigger Web Push + In-App Alerts only
        if (userChannels.push) activeDispatchChannels.push("push");
      }
    }

    // 5. Build user-friendly copy text
    const emojiMap = {
      critical: "🚨 CRITICAL THREAT DETECTED",
      high: "⚠️ HIGH-LEVEL SECURITY ALERT",
      medium: "💡 SECURITY ANOMALY RECORDED",
      low: "🛡️ COMPLIANCE INSIGHT",
      info: "ℹ️ STATUS MEMO",
    };

    const aiCopyMessage = `
${emojiMap[severity] || emojiMap.medium} on your website: ${alert.websiteName}

Anomaly: ${alert.threatName}
Details: ${alert.aiSummary}

RECOMMENDED SAFE ACTION:
👉 ${alert.recommendedAction}

(Autonomous Intelligence Division, AI Cyber Defense Platform)
    `.trim();

    // 6. Push delivery order to Dispatcher
    let dispatchReceipts: NotificationDeliveryReceipt[] = [];
    if (shouldNotify && activeDispatchChannels.length > 0) {
      dispatchReceipts = await NotificationService.deliver(
        userId,
        activeDispatchChannels,
        `[CYBER DEFENSE] ${alert.threatName} (${severity.toUpperCase()})`,
        aiCopyMessage
      );
    } else {
      dispatchReceipts = [
        {
          channel: "dashboard",
          status: "delivered",
          details: "Unsent to active gateways. Dashboard log completed successfully.",
        },
      ];
    }

    return {
      alertId: alert.id,
      severity,
      shouldNotify,
      suppressionReason: suppressionReason || undefined,
      dispatchReceipts,
      aiCopyMessage,
    };
  }

  private static isTimeInRange(time: string, start: string, end: string): boolean {
    const parse = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const currMins = parse(time);
    const startMins = parse(start);
    const endMins = parse(end);

    if (startMins <= endMins) {
      return currMins >= startMins && currMins <= endMins;
    } else {
      // Overnight range, e.g. 22:00 to 07:00
      return currMins >= startMins || currMins <= endMins;
    }
  }
}
