// Scheduler for scheduled SMS sending and status checking
import cron from "node-cron";
import { storage } from "./storage";
import { sendSms, checkSmsStatus, mapSmsStatusToNotificationStatus } from "./smsService";

let schedulerStarted = false;

export function startScheduler() {
  if (schedulerStarted) {
    console.log("Scheduler already started");
    return;
  }

  // Check for scheduled notifications every minute
  cron.schedule("* * * * *", async () => {
    try {
      const scheduledNotifications = await storage.getScheduledNotifications();
      
      for (const notification of scheduledNotifications) {
        const participant = await storage.getParticipantById(notification.participantId);
        if (!participant) {
          await storage.updateNotificationStatus(notification.id, "error", {
            errorMessage: "Participant not found",
          });
          continue;
        }

        // Send the SMS
        const result = await sendSms(participant.phone, notification.message);

        if (result.success) {
          await storage.updateNotificationStatus(notification.id, "sent", {
            sentAt: new Date(),
            smsId: result.smsId,
            apiResponse: result.response,
          });

          await storage.createEventLog({
            participantId: notification.participantId,
            staffGroupId: notification.staffGroupId,
            notificationId: notification.id,
            action: "sms_sent",
            details: `Scheduled SMS sent to ${participant.fullName} (${participant.phone})`,
            result: "success",
            apiResponse: result.response,
          });
        } else {
          await storage.updateNotificationStatus(notification.id, "error", {
            errorMessage: result.error,
            apiResponse: result.response,
          });

          await storage.createEventLog({
            participantId: notification.participantId,
            staffGroupId: notification.staffGroupId,
            notificationId: notification.id,
            action: "sms_send_failed",
            details: `Failed to send scheduled SMS to ${participant.fullName}`,
            result: "error",
            errorMessage: result.error,
            apiResponse: result.response,
          });
        }
      }
    } catch (error) {
      console.error("Error processing scheduled notifications:", error);
    }
  });

  // Check SMS delivery status every 2 minutes
  cron.schedule("*/2 * * * *", async () => {
    try {
      // Get notifications that are in "sent" status awaiting delivery confirmation
      const sendingNotifications = (await storage.getSentNotifications()).filter(
        (n) => n.smsId
      );

      for (const notification of sendingNotifications) {
        if (!notification.smsId) continue;

        const statusResult = await checkSmsStatus(notification.smsId);

        if (statusResult.success && statusResult.status) {
          const newStatus = mapSmsStatusToNotificationStatus(statusResult.status);
          
          if (newStatus !== notification.status) {
            const updateData: any = {
              apiResponse: statusResult.response,
            };

            if (newStatus === "delivered") {
              updateData.deliveredAt = new Date();
            }

            await storage.updateNotificationStatus(notification.id, newStatus, updateData);

            if (newStatus === "delivered") {
              await storage.createEventLog({
                participantId: notification.participantId,
                staffGroupId: notification.staffGroupId,
                notificationId: notification.id,
                action: "sms_delivered",
                details: `SMS delivered to ${notification.participant?.fullName || "Unknown"}`,
                result: "success",
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking SMS status:", error);
    }
  });

  schedulerStarted = true;
  console.log("SMS scheduler started");
}
