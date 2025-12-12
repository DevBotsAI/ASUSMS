import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./simpleAuth";
import { startScheduler } from "./scheduler";
import { sendSms, checkSmsStatus, mapSmsStatusToNotificationStatus, getBalance, getErrorDescription } from "./smsService";
import {
  insertStaffGroupSchema,
  insertParticipantSchema,
  insertMessageTemplateSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth middleware
  await setupAuth(app);

  // Start SMS scheduler
  startScheduler();

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ===== Staff Groups =====
  app.get("/api/staff-groups", isAuthenticated, async (req, res) => {
    try {
      const groups = await storage.getAllStaffGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching staff groups:", error);
      res.status(500).json({ message: "Failed to fetch staff groups" });
    }
  });

  app.get("/api/staff-groups/:id", isAuthenticated, async (req, res) => {
    try {
      const group = await storage.getStaffGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Staff group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching staff group:", error);
      res.status(500).json({ message: "Failed to fetch staff group" });
    }
  });

  app.post("/api/staff-groups", isAuthenticated, async (req, res) => {
    try {
      const data = insertStaffGroupSchema.parse(req.body);
      const group = await storage.createStaffGroup(data);
      
      await storage.createEventLog({
        staffGroupId: group.id,
        action: "staff_group_created",
        details: `Staff group "${group.name}" created`,
        result: "success",
      });

      res.status(201).json(group);
    } catch (error: any) {
      console.error("Error creating staff group:", error);
      res.status(400).json({ message: error.message || "Failed to create staff group" });
    }
  });

  app.patch("/api/staff-groups/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertStaffGroupSchema.partial().parse(req.body);
      const group = await storage.updateStaffGroup(req.params.id, data);
      if (!group) {
        return res.status(404).json({ message: "Staff group not found" });
      }

      await storage.createEventLog({
        staffGroupId: group.id,
        action: "staff_group_updated",
        details: `Staff group "${group.name}" updated`,
        result: "success",
      });

      res.json(group);
    } catch (error: any) {
      console.error("Error updating staff group:", error);
      res.status(400).json({ message: error.message || "Failed to update staff group" });
    }
  });

  app.delete("/api/staff-groups/:id", isAuthenticated, async (req, res) => {
    try {
      const group = await storage.getStaffGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Staff group not found" });
      }

      await storage.deleteStaffGroup(req.params.id);

      await storage.createEventLog({
        action: "staff_group_deleted",
        details: `Staff group "${group.name}" deleted`,
        result: "success",
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting staff group:", error);
      res.status(500).json({ message: "Failed to delete staff group" });
    }
  });

  // Nested routes for staff groups
  app.get("/api/staff-groups/:id/participants", isAuthenticated, async (req, res) => {
    try {
      const participants = await storage.getParticipantsByStaffGroupId(req.params.id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  app.get("/api/staff-groups/:id/stats", isAuthenticated, async (req, res) => {
    try {
      const staffGroupId = req.params.id;
      const participants = await storage.getParticipantsByStaffGroupId(staffGroupId);
      const notifications = await storage.getNotificationsByStaffGroupId(staffGroupId);
      
      const delivered = notifications.filter(n => n.status === "delivered").length;
      const error = notifications.filter(n => n.status === "error").length;
      const scheduled = notifications.filter(n => n.status === "scheduled").length;

      res.json({
        total: participants.length,
        delivered,
        error,
        scheduled,
      });
    } catch (error) {
      console.error("Error fetching staff group stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ===== Participants =====
  app.get("/api/participants", isAuthenticated, async (req, res) => {
    try {
      const { staffGroupId } = req.query;
      if (staffGroupId && typeof staffGroupId === "string") {
        const participants = await storage.getParticipantsByStaffGroupId(staffGroupId);
        return res.json(participants);
      }
      const participants = await storage.getAllParticipants();
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  app.get("/api/participants/:id", isAuthenticated, async (req, res) => {
    try {
      const participant = await storage.getParticipantById(req.params.id);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      console.error("Error fetching participant:", error);
      res.status(500).json({ message: "Failed to fetch participant" });
    }
  });

  app.post("/api/participants", isAuthenticated, async (req, res) => {
    try {
      const data = insertParticipantSchema.parse(req.body);
      const participant = await storage.createParticipant(data);

      await storage.createEventLog({
        participantId: participant.id,
        staffGroupId: participant.staffGroupId,
        action: "participant_created",
        details: `Participant "${participant.fullName}" added`,
        result: "success",
      });

      res.status(201).json(participant);
    } catch (error: any) {
      console.error("Error creating participant:", error);
      res.status(400).json({ message: error.message || "Failed to create participant" });
    }
  });

  app.post("/api/participants/bulk", isAuthenticated, async (req, res) => {
    try {
      const { participants: participantsData, staffGroupId } = req.body;
      
      if (!Array.isArray(participantsData)) {
        return res.status(400).json({ message: "Participants must be an array" });
      }

      const validParticipants = participantsData.map((p: any) => ({
        fullName: p.fullName || p.name || "",
        phone: p.phone || "",
        position: p.position || null,
        staffGroupId: staffGroupId || null,
      })).filter((p: any) => p.fullName && p.phone);

      const created = await storage.createParticipants(validParticipants);

      await storage.createEventLog({
        staffGroupId: staffGroupId,
        action: "participants_imported",
        details: `${created.length} participants imported`,
        result: "success",
      });

      res.status(201).json(created);
    } catch (error: any) {
      console.error("Error creating participants:", error);
      res.status(400).json({ message: error.message || "Failed to create participants" });
    }
  });

  app.patch("/api/participants/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertParticipantSchema.partial().parse(req.body);
      const participant = await storage.updateParticipant(req.params.id, data);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }

      await storage.createEventLog({
        participantId: participant.id,
        staffGroupId: participant.staffGroupId,
        action: "participant_updated",
        details: `Participant "${participant.fullName}" updated`,
        result: "success",
      });

      res.json(participant);
    } catch (error: any) {
      console.error("Error updating participant:", error);
      res.status(400).json({ message: error.message || "Failed to update participant" });
    }
  });

  app.delete("/api/participants/:id", isAuthenticated, async (req, res) => {
    try {
      const participant = await storage.getParticipantById(req.params.id);
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }

      await storage.deleteParticipant(req.params.id);

      await storage.createEventLog({
        staffGroupId: participant.staffGroupId,
        action: "participant_deleted",
        details: `Participant "${participant.fullName}" deleted`,
        result: "success",
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting participant:", error);
      res.status(500).json({ message: "Failed to delete participant" });
    }
  });

  // ===== Notifications / SMS Sending =====
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const { staffGroupId } = req.query;
      if (staffGroupId && typeof staffGroupId === "string") {
        const notifications = await storage.getNotificationsByStaffGroupId(staffGroupId);
        return res.json(notifications);
      }
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/send", isAuthenticated, async (req, res) => {
    try {
      const { participantIds, staffGroupId, message, scheduledAt } = req.body;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: "No participants selected" });
      }
      if (!message || typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({ message: "Message is required" });
      }

      const results = [];
      const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

      for (const participantId of participantIds) {
        const participant = await storage.getParticipantById(participantId);
        if (!participant) {
          results.push({ participantId, success: false, error: "Participant not found" });
          continue;
        }

        // Create notification record
        const notification = await storage.createNotification({
          participantId,
          staffGroupId: staffGroupId || participant.staffGroupId || null,
          message,
          status: isScheduled ? "scheduled" : "pending",
          scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        });

        if (isScheduled) {
          // For scheduled notifications, just log and continue
          await storage.createEventLog({
            participantId,
            staffGroupId: staffGroupId || participant.staffGroupId,
            notificationId: notification.id,
            action: "sms_scheduled",
            details: `SMS scheduled for ${participant.fullName} (${participant.phone}) at ${scheduledAt}`,
            result: "success",
          });
          results.push({ participantId, success: true, scheduled: true });
        } else {
          // Send immediately
          const smsResult = await sendSms(participant.phone, message);

          if (smsResult.success) {
            await storage.updateNotificationStatus(notification.id, "sending", {
              sentAt: new Date(),
              smsId: smsResult.smsId,
              apiResponse: smsResult.response,
            });

            await storage.createEventLog({
              participantId,
              staffGroupId: staffGroupId || participant.staffGroupId,
              notificationId: notification.id,
              action: "sms_sent",
              details: `SMS отправлено: ${participant.fullName} (${participant.phone}) - ${getErrorDescription("0")}`,
              result: "success",
              apiRequest: smsResult.request,
              apiResponse: smsResult.response,
            });

            results.push({ participantId, success: true, smsId: smsResult.smsId });
          } else {
            const errorDesc = smsResult.errCode 
              ? getErrorDescription(smsResult.errCode)
              : smsResult.error || "Неизвестная ошибка";

            await storage.updateNotificationStatus(notification.id, "error", {
              errorMessage: errorDesc,
              apiResponse: smsResult.response,
            });

            await storage.createEventLog({
              participantId,
              staffGroupId: staffGroupId || participant.staffGroupId,
              notificationId: notification.id,
              action: "sms_send_failed",
              details: errorDesc,
              result: "error",
              errorMessage: errorDesc,
              apiRequest: smsResult.request,
              apiResponse: smsResult.response,
            });

            results.push({ participantId, success: false, error: errorDesc });
          }
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      res.json({
        success: failCount === 0,
        total: results.length,
        successCount,
        failCount,
        results,
      });
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      res.status(500).json({ message: error.message || "Failed to send notifications" });
    }
  });

  app.post("/api/notifications/:id/check-status", isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.getNotificationById(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (!notification.smsId) {
        return res.status(400).json({ message: "No SMS ID associated with this notification" });
      }

      const statusResult = await checkSmsStatus(notification.smsId);

      if (statusResult.success && statusResult.status) {
        const newStatus = mapSmsStatusToNotificationStatus(statusResult.status);
        const updateData: any = { apiResponse: statusResult.response };

        if (newStatus === "delivered") {
          updateData.deliveredAt = new Date();
        }

        const updated = await storage.updateNotificationStatus(notification.id, newStatus, updateData);
        res.json({ success: true, status: newStatus, notification: updated });
      } else {
        res.json({ success: false, error: statusResult.error });
      }
    } catch (error: any) {
      console.error("Error checking notification status:", error);
      res.status(500).json({ message: error.message || "Failed to check status" });
    }
  });

  // ===== Message Templates =====
  app.get("/api/message-templates", isAuthenticated, async (req, res) => {
    try {
      const { staffGroupId } = req.query;
      if (staffGroupId && typeof staffGroupId === "string") {
        const templates = await storage.getMessageTemplatesByStaffGroupId(staffGroupId);
        return res.json(templates);
      }
      const templates = await storage.getAllMessageTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching message templates:", error);
      res.status(500).json({ message: "Failed to fetch message templates" });
    }
  });

  app.post("/api/message-templates", isAuthenticated, async (req, res) => {
    try {
      const data = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.createMessageTemplate(data);
      res.status(201).json(template);
    } catch (error: any) {
      console.error("Error creating message template:", error);
      res.status(400).json({ message: error.message || "Failed to create message template" });
    }
  });

  app.patch("/api/message-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const data = insertMessageTemplateSchema.partial().parse(req.body);
      const template = await storage.updateMessageTemplate(req.params.id, data);
      if (!template) {
        return res.status(404).json({ message: "Message template not found" });
      }
      res.json(template);
    } catch (error: any) {
      console.error("Error updating message template:", error);
      res.status(400).json({ message: error.message || "Failed to update message template" });
    }
  });

  app.delete("/api/message-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteMessageTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Message template not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message template:", error);
      res.status(500).json({ message: "Failed to delete message template" });
    }
  });

  // ===== Event Logs =====
  app.get("/api/event-logs", isAuthenticated, async (req, res) => {
    try {
      const { staffGroupId, limit } = req.query;
      const limitNum = limit ? parseInt(limit as string, 10) : 100;

      if (staffGroupId && typeof staffGroupId === "string") {
        const logs = await storage.getEventLogsByStaffGroupId(staffGroupId);
        return res.json(logs);
      }
      const logs = await storage.getAllEventLogs(limitNum);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching event logs:", error);
      res.status(500).json({ message: "Failed to fetch event logs" });
    }
  });

  // ===== Stats =====
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ===== Balance =====
  app.get("/api/balance", isAuthenticated, async (req, res) => {
    try {
      const result = await getBalance();
      if (result.success) {
        res.json({ balance: result.balance });
      } else {
        res.status(500).json({ message: result.error || "Failed to get balance" });
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  return httpServer;
}
