CREATE TABLE IF NOT EXISTS "saved_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"message_role" text NOT NULL,
	"message_content" jsonb NOT NULL,
	"original_chat_id" uuid,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_messages_user_message_unique" UNIQUE("user_id","message_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_messages" ADD CONSTRAINT "saved_messages_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_messages" ADD CONSTRAINT "saved_messages_original_chat_id_Chat_id_fk" FOREIGN KEY ("original_chat_id") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saved_messages_user_idx" ON "saved_messages" USING btree ("user_id");