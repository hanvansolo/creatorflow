CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(20) NOT NULL,
	"content_type" varchar(30) NOT NULL,
	"content_id" varchar(250) NOT NULL,
	"post_text" text NOT NULL,
	"external_post_id" varchar(250),
	"status" varchar(20) DEFAULT 'posted' NOT NULL,
	"error" text,
	"posted_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "social_posted" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "idx_social_posts_content" ON "social_posts" USING btree ("content_type","content_id");--> statement-breakpoint
CREATE INDEX "idx_social_posts_platform" ON "social_posts" USING btree ("platform","posted_at");
