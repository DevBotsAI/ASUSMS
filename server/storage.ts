// Database Storage implementation (blueprint:javascript_database)
import {
  users,
  staffGroups,
  participants,
  notifications,
  messageTemplates,
  eventLogs,
  type User,
  type UpsertUser,
  type StaffGroup,
  type InsertStaffGroup,
  type Participant,
  type InsertParticipant,
  type Notification,
  type InsertNotification,
  type MessageTemplate,
  type InsertMessageTemplate,
  type EventLog,
  type InsertEventLog,
  type StaffGroupWithParticipants,
  type NotificationWithDetails,
  type EventLogWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, count as drizzleCount } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Staff Group operations
  getAllStaffGroups(): Promise<StaffGroupWithParticipants[]>;
  getStaffGroupById(id: string): Promise<StaffGroupWithParticipants | undefined>;
  createStaffGroup(data: InsertStaffGroup): Promise<StaffGroup>;
  updateStaffGroup(id: string, data: Partial<InsertStaffGroup>): Promise<StaffGroup | undefined>;
  deleteStaffGroup(id: string): Promise<boolean>;

  // Participant operations
  getAllParticipants(): Promise<Participant[]>;
  getParticipantsByStaffGroupId(staffGroupId: string): Promise<Participant[]>;
  getParticipantById(id: string): Promise<Participant | undefined>;
  createParticipant(data: InsertParticipant): Promise<Participant>;
  createParticipants(data: InsertParticipant[]): Promise<Participant[]>;
  updateParticipant(id: string, data: Partial<InsertParticipant>): Promise<Participant | undefined>;
  deleteParticipant(id: string): Promise<boolean>;
  deleteParticipantsByStaffGroupId(staffGroupId: string): Promise<boolean>;

  // Notification operations
  getAllNotifications(): Promise<NotificationWithDetails[]>;
  getNotificationsByStaffGroupId(staffGroupId: string): Promise<NotificationWithDetails[]>;
  getNotificationById(id: string): Promise<Notification | undefined>;
  createNotification(data: InsertNotification): Promise<Notification>;
  createNotifications(data: InsertNotification[]): Promise<Notification[]>;
  updateNotificationStatus(id: string, status: string, extra?: Partial<Notification>): Promise<Notification | undefined>;
  getScheduledNotifications(): Promise<Notification[]>;
  getSendingNotifications(): Promise<NotificationWithDetails[]>;

  // Message Template operations
  getAllMessageTemplates(): Promise<MessageTemplate[]>;
  getMessageTemplatesByStaffGroupId(staffGroupId: string | null): Promise<MessageTemplate[]>;
  createMessageTemplate(data: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: string, data: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: string): Promise<boolean>;

  // Event Log operations
  getAllEventLogs(limit?: number): Promise<EventLogWithDetails[]>;
  getEventLogsByStaffGroupId(staffGroupId: string): Promise<EventLogWithDetails[]>;
  createEventLog(data: InsertEventLog): Promise<EventLog>;

  // Stats
  getStats(): Promise<{
    totalStaffGroups: number;
    totalParticipants: number;
    totalNotificationsSent: number;
    totalNotificationsDelivered: number;
  }>;

  // Reset notifications
  deleteNotificationsByStatus(status: string, staffGroupId?: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Staff Group operations
  async getAllStaffGroups(): Promise<StaffGroupWithParticipants[]> {
    const groups = await db.select().from(staffGroups).orderBy(desc(staffGroups.createdAt));
    const result: StaffGroupWithParticipants[] = [];
    
    for (const group of groups) {
      const groupParticipants = await db
        .select()
        .from(participants)
        .where(eq(participants.staffGroupId, group.id));
      result.push({
        ...group,
        participants: groupParticipants,
        participantCount: groupParticipants.length,
      });
    }
    
    return result;
  }

  async getStaffGroupById(id: string): Promise<StaffGroupWithParticipants | undefined> {
    const [group] = await db.select().from(staffGroups).where(eq(staffGroups.id, id));
    if (!group) return undefined;

    const groupParticipants = await db
      .select()
      .from(participants)
      .where(eq(participants.staffGroupId, id));

    return {
      ...group,
      participants: groupParticipants,
      participantCount: groupParticipants.length,
    };
  }

  async createStaffGroup(data: InsertStaffGroup): Promise<StaffGroup> {
    const [group] = await db.insert(staffGroups).values(data).returning();
    return group;
  }

  async updateStaffGroup(id: string, data: Partial<InsertStaffGroup>): Promise<StaffGroup | undefined> {
    const [group] = await db
      .update(staffGroups)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(staffGroups.id, id))
      .returning();
    return group;
  }

  async deleteStaffGroup(id: string): Promise<boolean> {
    const result = await db.delete(staffGroups).where(eq(staffGroups.id, id)).returning();
    return result.length > 0;
  }

  // Participant operations
  async getAllParticipants(): Promise<Participant[]> {
    return db.select().from(participants).orderBy(desc(participants.createdAt));
  }

  async getParticipantsByStaffGroupId(staffGroupId: string): Promise<Participant[]> {
    return db
      .select()
      .from(participants)
      .where(eq(participants.staffGroupId, staffGroupId))
      .orderBy(participants.fullName);
  }

  async getParticipantById(id: string): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.id, id));
    return participant;
  }

  async createParticipant(data: InsertParticipant): Promise<Participant> {
    const [participant] = await db.insert(participants).values(data).returning();
    return participant;
  }

  async createParticipants(data: InsertParticipant[]): Promise<Participant[]> {
    if (data.length === 0) return [];
    return db.insert(participants).values(data).returning();
  }

  async updateParticipant(id: string, data: Partial<InsertParticipant>): Promise<Participant | undefined> {
    const [participant] = await db
      .update(participants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(participants.id, id))
      .returning();
    return participant;
  }

  async deleteParticipant(id: string): Promise<boolean> {
    const result = await db.delete(participants).where(eq(participants.id, id)).returning();
    return result.length > 0;
  }

  async deleteParticipantsByStaffGroupId(staffGroupId: string): Promise<boolean> {
    await db.delete(participants).where(eq(participants.staffGroupId, staffGroupId));
    return true;
  }

  // Notification operations
  async getAllNotifications(): Promise<NotificationWithDetails[]> {
    const notificationsList = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    const result: NotificationWithDetails[] = [];
    for (const notification of notificationsList) {
      const [participant] = await db
        .select()
        .from(participants)
        .where(eq(participants.id, notification.participantId));
      
      let staffGroup = null;
      if (notification.staffGroupId) {
        const [sg] = await db
          .select()
          .from(staffGroups)
          .where(eq(staffGroups.id, notification.staffGroupId));
        staffGroup = sg;
      }

      result.push({
        ...notification,
        participant,
        staffGroup,
      });
    }

    return result;
  }

  async getNotificationsByStaffGroupId(staffGroupId: string): Promise<NotificationWithDetails[]> {
    const notificationsList = await db
      .select()
      .from(notifications)
      .where(eq(notifications.staffGroupId, staffGroupId))
      .orderBy(desc(notifications.createdAt));

    const result: NotificationWithDetails[] = [];
    for (const notification of notificationsList) {
      const [participant] = await db
        .select()
        .from(participants)
        .where(eq(participants.id, notification.participantId));

      result.push({
        ...notification,
        participant,
      });
    }

    return result;
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  }

  async createNotifications(data: InsertNotification[]): Promise<Notification[]> {
    if (data.length === 0) return [];
    return db.insert(notifications).values(data).returning();
  }

  async updateNotificationStatus(
    id: string,
    status: string,
    extra?: Partial<Notification>
  ): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ status, ...extra, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async getScheduledNotifications(): Promise<Notification[]> {
    const now = new Date();
    return db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.status, "scheduled"),
          sql`${notifications.scheduledAt} <= ${now}`
        )
      );
  }

  async getSendingNotifications(): Promise<NotificationWithDetails[]> {
    const notificationsList = await db
      .select()
      .from(notifications)
      .where(eq(notifications.status, "sending"))
      .orderBy(desc(notifications.createdAt));

    const result: NotificationWithDetails[] = [];
    for (const notification of notificationsList) {
      const [participant] = await db
        .select()
        .from(participants)
        .where(eq(participants.id, notification.participantId));

      result.push({
        ...notification,
        participant,
      });
    }

    return result;
  }

  // Message Template operations
  async getAllMessageTemplates(): Promise<MessageTemplate[]> {
    return db.select().from(messageTemplates).orderBy(messageTemplates.name);
  }

  async getMessageTemplatesByStaffGroupId(staffGroupId: string | null): Promise<MessageTemplate[]> {
    if (staffGroupId === null) {
      return db
        .select()
        .from(messageTemplates)
        .where(sql`${messageTemplates.staffGroupId} IS NULL`)
        .orderBy(messageTemplates.name);
    }
    return db
      .select()
      .from(messageTemplates)
      .where(eq(messageTemplates.staffGroupId, staffGroupId))
      .orderBy(messageTemplates.name);
  }

  async createMessageTemplate(data: InsertMessageTemplate): Promise<MessageTemplate> {
    const [template] = await db.insert(messageTemplates).values(data).returning();
    return template;
  }

  async updateMessageTemplate(
    id: string,
    data: Partial<InsertMessageTemplate>
  ): Promise<MessageTemplate | undefined> {
    const [template] = await db
      .update(messageTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(messageTemplates.id, id))
      .returning();
    return template;
  }

  async deleteMessageTemplate(id: string): Promise<boolean> {
    const result = await db.delete(messageTemplates).where(eq(messageTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Event Log operations
  async getAllEventLogs(limit: number = 100): Promise<EventLogWithDetails[]> {
    const logs = await db
      .select()
      .from(eventLogs)
      .orderBy(desc(eventLogs.createdAt))
      .limit(limit);

    const result: EventLogWithDetails[] = [];
    for (const log of logs) {
      let participant = null;
      let staffGroup = null;
      let notification = null;

      if (log.participantId) {
        const [p] = await db.select().from(participants).where(eq(participants.id, log.participantId));
        participant = p;
      }
      if (log.staffGroupId) {
        const [sg] = await db.select().from(staffGroups).where(eq(staffGroups.id, log.staffGroupId));
        staffGroup = sg;
      }
      if (log.notificationId) {
        const [n] = await db.select().from(notifications).where(eq(notifications.id, log.notificationId));
        notification = n;
      }

      result.push({
        ...log,
        participant,
        staffGroup,
        notification,
      });
    }

    return result;
  }

  async getEventLogsByStaffGroupId(staffGroupId: string): Promise<EventLogWithDetails[]> {
    const logs = await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.staffGroupId, staffGroupId))
      .orderBy(desc(eventLogs.createdAt));

    const result: EventLogWithDetails[] = [];
    for (const log of logs) {
      let participant = null;
      let notification = null;

      if (log.participantId) {
        const [p] = await db.select().from(participants).where(eq(participants.id, log.participantId));
        participant = p;
      }
      if (log.notificationId) {
        const [n] = await db.select().from(notifications).where(eq(notifications.id, log.notificationId));
        notification = n;
      }

      result.push({
        ...log,
        participant,
        notification,
      });
    }

    return result;
  }

  async createEventLog(data: InsertEventLog): Promise<EventLog> {
    const [log] = await db.insert(eventLogs).values(data).returning();
    return log;
  }

  // Stats
  async getStats(): Promise<{
    totalStaffGroups: number;
    totalParticipants: number;
    totalNotificationsSent: number;
    totalNotificationsDelivered: number;
  }> {
    const [groupCount] = await db.select({ count: drizzleCount() }).from(staffGroups);
    const [participantCount] = await db.select({ count: drizzleCount() }).from(participants);
    const [sentCount] = await db
      .select({ count: drizzleCount() })
      .from(notifications)
      .where(sql`${notifications.status} IN ('sending', 'delivered', 'error')`);
    const [deliveredCount] = await db
      .select({ count: drizzleCount() })
      .from(notifications)
      .where(eq(notifications.status, "delivered"));

    return {
      totalStaffGroups: groupCount?.count ?? 0,
      totalParticipants: participantCount?.count ?? 0,
      totalNotificationsSent: sentCount?.count ?? 0,
      totalNotificationsDelivered: deliveredCount?.count ?? 0,
    };
  }

  async deleteNotificationsByStatus(status: string, staffGroupId?: string): Promise<number> {
    let condition;
    if (staffGroupId) {
      condition = and(
        eq(notifications.status, status),
        eq(notifications.staffGroupId, staffGroupId)
      );
    } else {
      condition = eq(notifications.status, status);
    }
    
    const deleted = await db.delete(notifications).where(condition).returning();
    return deleted.length;
  }
}

export const storage = new DatabaseStorage();
