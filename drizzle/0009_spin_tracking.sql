ALTER TABLE "news_articles" ADD COLUMN "spun_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "spin_attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Backfill spun_at for articles that look spun (>= 1500 chars of content = well
-- past the RSS-excerpt threshold, and past the spinner's 500-word output gate).
-- Prevents the respin cron from re-processing thousands of already-spun
-- articles on first run after this migration.
UPDATE "news_articles" SET "spun_at" = COALESCE("fetched_at", "created_at")
WHERE "content" IS NOT NULL AND LENGTH("content") >= 1500 AND "spun_at" IS NULL;
--> statement-breakpoint
-- Articles that made it into the DB but have short content already had at
-- least one attempt (during aggregate ingest). Start their counter at 1 so
-- they get at most 2 more respin tries before we give up.
UPDATE "news_articles" SET "spin_attempts" = 1
WHERE "content" IS NOT NULL AND LENGTH("content") < 1500 AND "spun_at" IS NULL;
