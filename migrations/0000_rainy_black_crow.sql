CREATE TABLE "event_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar,
	"staff_group_id" varchar,
	"notification_id" varchar,
	"action" text NOT NULL,
	"details" text,
	"result" text,
	"error_message" text,
	"api_request" text,
	"api_response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"staff_group_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" varchar NOT NULL,
	"staff_group_id" varchar,
	"message" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"error_message" text,
	"api_response" text,
	"sms_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"position" text,
	"staff_group_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar,
	"password" varchar,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_staff_group_id_staff_groups_id_fk" FOREIGN KEY ("staff_group_id") REFERENCES "public"."staff_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_staff_group_id_staff_groups_id_fk" FOREIGN KEY ("staff_group_id") REFERENCES "public"."staff_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_staff_group_id_staff_groups_id_fk" FOREIGN KEY ("staff_group_id") REFERENCES "public"."staff_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_staff_group_id_staff_groups_id_fk" FOREIGN KEY ("staff_group_id") REFERENCES "public"."staff_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");