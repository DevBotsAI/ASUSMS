import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Staff groups (Штабы)
export const staffGroups = pgTable("staff_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStaffGroupSchema = createInsertSchema(staffGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStaffGroup = z.infer<typeof insertStaffGroupSchema>;
export type StaffGroup = typeof staffGroups.$inferSelect;

// Participants (Участники)
export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  position: text("position"),
  staffGroupId: varchar("staff_group_id").references(() => staffGroups.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

// Notification status enum
export const notificationStatusEnum = ["pending", "sending", "delivered", "error", "scheduled"] as const;
export type NotificationStatus = typeof notificationStatusEnum[number];

// Notifications (Уведомления)
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "cascade" }).notNull(),
  staffGroupId: varchar("staff_group_id").references(() => staffGroups.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  errorMessage: text("error_message"),
  apiResponse: text("api_response"),
  smsId: text("sms_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Message templates (Шаблоны сообщений)
export const messageTemplates = pgTable("message_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  content: text("content").notNull(),
  staffGroupId: varchar("staff_group_id").references(() => staffGroups.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type MessageTemplate = typeof messageTemplates.$inferSelect;

// Event log (Журнал событий)
export const eventLogs = pgTable("event_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: varchar("participant_id").references(() => participants.id, { onDelete: "set null" }),
  staffGroupId: varchar("staff_group_id").references(() => staffGroups.id, { onDelete: "set null" }),
  notificationId: varchar("notification_id").references(() => notifications.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  details: text("details"),
  result: text("result"),
  errorMessage: text("error_message"),
  apiRequest: text("api_request"),
  apiResponse: text("api_response"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventLogSchema = createInsertSchema(eventLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
export type EventLog = typeof eventLogs.$inferSelect;

// Relations
export const staffGroupsRelations = relations(staffGroups, ({ many }) => ({
  participants: many(participants),
  notifications: many(notifications),
  messageTemplates: many(messageTemplates),
  eventLogs: many(eventLogs),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  staffGroup: one(staffGroups, {
    fields: [participants.staffGroupId],
    references: [staffGroups.id],
  }),
  notifications: many(notifications),
  eventLogs: many(eventLogs),
}));

export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  participant: one(participants, {
    fields: [notifications.participantId],
    references: [participants.id],
  }),
  staffGroup: one(staffGroups, {
    fields: [notifications.staffGroupId],
    references: [staffGroups.id],
  }),
  eventLogs: many(eventLogs),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({ one }) => ({
  staffGroup: one(staffGroups, {
    fields: [messageTemplates.staffGroupId],
    references: [staffGroups.id],
  }),
}));

export const eventLogsRelations = relations(eventLogs, ({ one }) => ({
  participant: one(participants, {
    fields: [eventLogs.participantId],
    references: [participants.id],
  }),
  staffGroup: one(staffGroups, {
    fields: [eventLogs.staffGroupId],
    references: [staffGroups.id],
  }),
  notification: one(notifications, {
    fields: [eventLogs.notificationId],
    references: [notifications.id],
  }),
}));

// Extended types with relations
export type ParticipantWithGroup = Participant & {
  staffGroup?: StaffGroup | null;
  notifications?: Notification[];
};

export type NotificationWithDetails = Notification & {
  participant?: Participant;
  staffGroup?: StaffGroup | null;
};

export type EventLogWithDetails = EventLog & {
  participant?: Participant | null;
  staffGroup?: StaffGroup | null;
  notification?: Notification | null;
};

export type StaffGroupWithParticipants = StaffGroup & {
  participants: Participant[];
  participantCount?: number;
};
