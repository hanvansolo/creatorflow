CREATE TABLE "article_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"source_id" uuid,
	"source_name" varchar(200),
	"original_url" text NOT NULL,
	"original_title" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "article_sources" ADD CONSTRAINT "article_sources_article_id_fk"
  FOREIGN KEY ("article_id") REFERENCES "news_articles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
--> statement-breakpoint
ALTER TABLE "article_sources" ADD CONSTRAINT "article_sources_source_id_fk"
  FOREIGN KEY ("source_id") REFERENCES "news_sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
--> statement-breakpoint
CREATE INDEX "idx_article_sources_article" ON "article_sources" ("article_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_article_sources_url" ON "article_sources" ("article_id", "original_url");
