CREATE TABLE "invite_records" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inviter_id" varchar(36) NOT NULL,
	"invited_user_id" varchar(36) NOT NULL,
	"reward_words" integer DEFAULT 500 NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "invite_records_invited_user_id_unique" UNIQUE("invited_user_id")
);
--> statement-breakpoint
CREATE TABLE "recharge_records" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"package_type" varchar(50) NOT NULL,
	"words_added" integer NOT NULL,
	"amount" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text_processing_records" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"original_text" text NOT NULL,
	"processed_text" text,
	"word_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"phone" varchar(11),
	"remaining_words" integer DEFAULT 0 NOT NULL,
	"total_words_used" integer DEFAULT 0 NOT NULL,
	"is_first_user" boolean DEFAULT true NOT NULL,
	"invite_code" varchar(16) DEFAULT '',
	"invited_by" varchar(36),
	"free_word_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE INDEX "invite_records_inviter_id_idx" ON "invite_records" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "recharge_records_user_id_idx" ON "recharge_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "text_processing_records_user_id_idx" ON "text_processing_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "users_invited_by_idx" ON "users" USING btree ("invited_by");