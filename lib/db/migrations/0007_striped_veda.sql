CREATE TABLE IF NOT EXISTS "saved_message" (
	"chatId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"savedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_message_userId_messageId_pk" PRIMARY KEY("userId","messageId")
);
--> statement-breakpoint
DROP TABLE "saved_messages";--> statement-breakpoint
DROP TABLE "Vote_v2";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_message" ADD CONSTRAINT "saved_message_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_message" ADD CONSTRAINT "saved_message_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_message" ADD CONSTRAINT "saved_message_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
