ALTER TABLE "settings" ADD COLUMN "preferred_name" varchar(50);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "user_role" varchar(100);--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "assistant_traits" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "additional_context" text;