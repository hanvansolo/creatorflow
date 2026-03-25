CREATE TABLE "article_regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"regulation_id" uuid NOT NULL,
	"relevance_score" integer NOT NULL,
	"matched_keywords" jsonb,
	"context_snippet" text,
	"match_type" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "article_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" uuid,
	"visitor_id" varchar(64),
	"vote_type" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_roundups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"verified_summary" text,
	"unverified_summary" text,
	"rumour_summary" text,
	"verified_article_count" integer DEFAULT 0,
	"unverified_article_count" integer DEFAULT 0,
	"rumour_article_count" integer DEFAULT 0,
	"last_updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "daily_roundups_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "f1_regulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_number" varchar(50) NOT NULL,
	"article_title" varchar(255) NOT NULL,
	"document" varchar(50) NOT NULL,
	"document_id" uuid,
	"category" varchar(30) NOT NULL,
	"chapter" varchar(100),
	"parent_article" varchar(50),
	"official_text" text NOT NULL,
	"simplified_explanation" text,
	"key_points" jsonb,
	"search_text" text,
	"keywords" jsonb,
	"related_topics" jsonb,
	"penalty_types" jsonb,
	"season_year" integer NOT NULL,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid NOT NULL,
	"session_type" varchar(20) NOT NULL,
	"incident_type" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"drivers" jsonb,
	"teams" jsonb,
	"lap" integer,
	"turn" varchar(20),
	"status" varchar(30) DEFAULT 'under_investigation',
	"decision" text,
	"penalty_type" varchar(50),
	"penalty_details" text,
	"matched_regulations" jsonb,
	"occurred_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"source_type" varchar(20),
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "preview_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"preview_id" uuid NOT NULL,
	"race_id" uuid NOT NULL,
	"trigger_session" varchar(50) NOT NULL,
	"weekend_phase" varchar(30) NOT NULL,
	"podium_prediction" jsonb,
	"dark_horse_pick" jsonb,
	"changes" jsonb,
	"update_summary" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "race_previews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid NOT NULL,
	"executive_summary" text,
	"key_battles" jsonb,
	"strategy_predictions" jsonb,
	"weather_analysis" jsonb,
	"historical_context" jsonb,
	"podium_prediction" jsonb,
	"dark_horse_pick" jsonb,
	"narrative_content" text,
	"weekend_phase" varchar(30) DEFAULT 'pre-weekend',
	"last_session_processed" varchar(50),
	"version" integer DEFAULT 1,
	"status" varchar(20) DEFAULT 'draft',
	"generated_at" timestamp with time zone DEFAULT now(),
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "race_previews_race_id_unique" UNIQUE("race_id")
);
--> statement-breakpoint
CREATE TABLE "regulation_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"season_year" integer NOT NULL,
	"source_url" text NOT NULL,
	"version" varchar(50),
	"effective_date" date,
	"scraped_at" timestamp with time zone,
	"article_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rumour_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rumour_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"credibility_rating" varchar(20) NOT NULL,
	"extracted_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rumours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"rumour_type" varchar(50) NOT NULL,
	"subject_driver_id" uuid,
	"subject_team_id" uuid,
	"target_team_id" uuid,
	"summary" text NOT NULL,
	"probability_score" integer NOT NULL,
	"probability_reasoning" text,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"status_history" jsonb DEFAULT '[]',
	"source_count" integer DEFAULT 1,
	"first_reported_at" timestamp with time zone DEFAULT now(),
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "rumours_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "site_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "technical_deep_dives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'intermediate',
	"summary" text NOT NULL,
	"explanation" text NOT NULL,
	"key_concepts" jsonb,
	"real_world_example" text,
	"visual_description" text,
	"source_article_id" uuid,
	"related_article_ids" uuid[],
	"trigger_phrase" text,
	"is_published" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "technical_deep_dives_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "what_if_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"slug" varchar(255) NOT NULL,
	"scenario_type" varchar(50) NOT NULL,
	"short_answer" text,
	"detailed_analysis" text,
	"key_factors" jsonb,
	"alternative_outcomes" jsonb,
	"confidence_level" varchar(20),
	"is_popular" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"generation_type" varchar(20),
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "what_if_scenarios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "fantasy_team_drivers" ADD COLUMN "role" varchar(20) DEFAULT 'secondary' NOT NULL;--> statement-breakpoint
ALTER TABLE "fantasy_teams" ADD COLUMN "constructor_id" uuid;--> statement-breakpoint
ALTER TABLE "fantasy_teams" ADD COLUMN "constructor_price" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "vote_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "regulations_processed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "article_regulations" ADD CONSTRAINT "article_regulations_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_regulations" ADD CONSTRAINT "article_regulations_regulation_id_f1_regulations_id_fk" FOREIGN KEY ("regulation_id") REFERENCES "public"."f1_regulations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_votes" ADD CONSTRAINT "article_votes_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_votes" ADD CONSTRAINT "article_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "f1_regulations" ADD CONSTRAINT "f1_regulations_document_id_regulation_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."regulation_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_incidents" ADD CONSTRAINT "live_incidents_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_updates" ADD CONSTRAINT "preview_updates_preview_id_race_previews_id_fk" FOREIGN KEY ("preview_id") REFERENCES "public"."race_previews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_updates" ADD CONSTRAINT "preview_updates_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_previews" ADD CONSTRAINT "race_previews_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rumour_sources" ADD CONSTRAINT "rumour_sources_rumour_id_rumours_id_fk" FOREIGN KEY ("rumour_id") REFERENCES "public"."rumours"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rumour_sources" ADD CONSTRAINT "rumour_sources_article_id_news_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."news_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rumours" ADD CONSTRAINT "rumours_subject_driver_id_drivers_id_fk" FOREIGN KEY ("subject_driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rumours" ADD CONSTRAINT "rumours_subject_team_id_teams_id_fk" FOREIGN KEY ("subject_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rumours" ADD CONSTRAINT "rumours_target_team_id_teams_id_fk" FOREIGN KEY ("target_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technical_deep_dives" ADD CONSTRAINT "technical_deep_dives_source_article_id_news_articles_id_fk" FOREIGN KEY ("source_article_id") REFERENCES "public"."news_articles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_article_regulations_unique" ON "article_regulations" USING btree ("article_id","regulation_id");--> statement-breakpoint
CREATE INDEX "idx_article_regulations_article" ON "article_regulations" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_article_regulations_regulation" ON "article_regulations" USING btree ("regulation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_article_votes_user" ON "article_votes" USING btree ("article_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_article_votes_visitor" ON "article_votes" USING btree ("article_id","visitor_id");--> statement-breakpoint
CREATE INDEX "idx_article_votes_article" ON "article_votes" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_f1_regulations_category" ON "f1_regulations" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_f1_regulations_season" ON "f1_regulations" USING btree ("season_year");--> statement-breakpoint
CREATE INDEX "idx_f1_regulations_document" ON "f1_regulations" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_f1_regulations_parent" ON "f1_regulations" USING btree ("parent_article");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_f1_regulations_article_season" ON "f1_regulations" USING btree ("article_number","document","season_year");--> statement-breakpoint
CREATE INDEX "idx_live_incidents_race" ON "live_incidents" USING btree ("race_id");--> statement-breakpoint
CREATE INDEX "idx_live_incidents_status" ON "live_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_live_incidents_occurred" ON "live_incidents" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_preview_updates_preview" ON "preview_updates" USING btree ("preview_id");--> statement-breakpoint
CREATE INDEX "idx_preview_updates_race" ON "preview_updates" USING btree ("race_id");--> statement-breakpoint
CREATE INDEX "idx_race_previews_race" ON "race_previews" USING btree ("race_id");--> statement-breakpoint
CREATE INDEX "idx_race_previews_status" ON "race_previews" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_regulation_documents_unique" ON "regulation_documents" USING btree ("document_type","season_year","version");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_rumour_source_unique" ON "rumour_sources" USING btree ("rumour_id","article_id");--> statement-breakpoint
CREATE INDEX "idx_rumour_sources_rumour" ON "rumour_sources" USING btree ("rumour_id");--> statement-breakpoint
CREATE INDEX "idx_rumours_status" ON "rumours" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_rumours_probability" ON "rumours" USING btree ("probability_score");--> statement-breakpoint
CREATE INDEX "idx_technical_deep_dives_category" ON "technical_deep_dives" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_technical_deep_dives_source" ON "technical_deep_dives" USING btree ("source_article_id");--> statement-breakpoint
CREATE INDEX "idx_what_if_scenarios_type" ON "what_if_scenarios" USING btree ("scenario_type");--> statement-breakpoint
CREATE INDEX "idx_what_if_scenarios_popular" ON "what_if_scenarios" USING btree ("is_popular");--> statement-breakpoint
CREATE INDEX "idx_what_if_scenarios_views" ON "what_if_scenarios" USING btree ("view_count");--> statement-breakpoint
ALTER TABLE "fantasy_teams" ADD CONSTRAINT "fantasy_teams_constructor_id_teams_id_fk" FOREIGN KEY ("constructor_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;