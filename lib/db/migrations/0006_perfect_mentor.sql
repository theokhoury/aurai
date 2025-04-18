-- Rename the existing Bookmark table to Snippet
-- ALTER TABLE "Bookmark" RENAME TO "Snippet"; --> Commented out problematic line

-- Add the new 'text' column to the renamed table
-- Adding a temporary default value to handle existing rows
-- ALTER TABLE "Snippet" ADD COLUMN "text" text NOT NULL DEFAULT ''; --> Commented out problematic line

-- Update the default value constraint for the title column
ALTER TABLE "Snippet" ALTER COLUMN "title" SET DEFAULT 'Untitled Snippet';

-- Rename the primary key constraint 
-- Note: The original constraint name 'Bookmark_pkey' might differ slightly.
-- Please verify in your DB if this specific rename fails.
-- ALTER TABLE "Snippet" RENAME CONSTRAINT "Bookmark_pkey" TO "Snippet_userId_chatId_messageId_pk"; --> Commented out

-- Rename foreign key constraints 
-- Note: The original constraint names might differ slightly. 
-- Please verify in your DB if these specific renames fail.
-- ALTER TABLE "Snippet" RENAME CONSTRAINT "Bookmark_userId_User_id_fk" TO "Snippet_userId_User_id_fk"; --> Commented out
-- ALTER TABLE "Snippet" RENAME CONSTRAINT "Bookmark_chatId_Chat_id_fk" TO "Snippet_chatId_Chat_id_fk"; --> Commented out
-- ALTER TABLE "Snippet" RENAME CONSTRAINT "Bookmark_messageId_Message_v2_id_fk" TO "Snippet_messageId_Message_v2_id_fk"; --> Commented out

-- Remove the temporary default value for the text column
ALTER TABLE "Snippet" ALTER COLUMN "text" DROP DEFAULT;

-- The following lines generated previously are commented out as they seemed unrelated
-- --> statement-breakpoint
-- DROP TABLE "Vote_v2";--> statement-breakpoint
-- DROP TABLE "Vote";--> statement-breakpoint
-- DO $$ BEGIN
--  ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;
-- --> statement-breakpoint
-- DO $$ BEGIN
--  ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;
-- --> statement-breakpoint
-- DO $$ BEGIN
--  ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;

CREATE TABLE IF NOT EXISTS "Snippet" (
	"userId" uuid NOT NULL,
	"chatId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"title" text DEFAULT 'Untitled Snippet' NOT NULL,
	"text" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Snippet_userId_chatId_messageId_pk" PRIMARY KEY("userId","chatId","messageId")
);
--> statement-breakpoint
DROP TABLE "Vote_v2";--> statement-breakpoint
DROP TABLE "Vote";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Snippet" ADD CONSTRAINT "Snippet_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;