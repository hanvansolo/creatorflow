CREATE TABLE "broadcast_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"region" varchar(50) NOT NULL,
	"logo_url" text,
	"website_url" text,
	"streaming_url" text,
	"is_streaming" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "broadcast_channels_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cron_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_name" varchar(50) NOT NULL,
	"interval_ms" integer NOT NULL,
	"enabled" boolean DEFAULT true,
	"last_run_at" timestamp with time zone,
	"last_status" varchar(20),
	"last_result" jsonb,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "cron_settings_job_name_unique" UNIQUE("job_name")
);
--> statement-breakpoint
CREATE TABLE "league_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"user_id" uuid,
	"is_ai" boolean DEFAULT false,
	"display_name" varchar(100),
	"role" varchar(20) DEFAULT 'member',
	"total_points" integer DEFAULT 0,
	"joined_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "league_race_standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"race_id" uuid NOT NULL,
	"league_member_id" uuid NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"position" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"invite_code" varchar(8) NOT NULL,
	"owner_id" uuid NOT NULL,
	"season_year" integer DEFAULT 2026 NOT NULL,
	"is_public" boolean DEFAULT false,
	"max_members" integer DEFAULT 50,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "leagues_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "session_broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_session_id" uuid,
	"testing_session_id" uuid,
	"channel_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "testing_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"circuit_id" uuid,
	"season_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_days" integer DEFAULT 3 NOT NULL,
	"status" varchar(20) DEFAULT 'upcoming',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "testing_events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "testing_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"driver_id" uuid,
	"team_id" uuid,
	"best_lap_time" varchar(20),
	"best_lap_time_ms" integer,
	"total_laps" integer DEFAULT 0,
	"sector1" varchar(15),
	"sector2" varchar(15),
	"sector3" varchar(15),
	"long_run_pace" varchar(20),
	"long_run_pace_ms" integer,
	"long_run_laps" integer DEFAULT 0,
	"tyre_compound" varchar(20),
	"reliability_issues" text,
	"notes" text,
	"position" integer,
	"gap_to_leader" varchar(15),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "testing_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"day" integer NOT NULL,
	"session_name" varchar(50) NOT NULL,
	"session_date" date NOT NULL,
	"start_time" timestamp with time zone,
	"end_time" timestamp with time zone,
	"weather_conditions" varchar(50),
	"track_temp" numeric(5, 1),
	"air_temp" numeric(5, 1),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid NOT NULL,
	"league_member_id" uuid NOT NULL,
	"predicted_order" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"locked_at" timestamp with time zone,
	"is_locked" boolean DEFAULT false,
	"points_earned" integer,
	"accuracy" jsonb,
	"scored_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" varchar(100),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "career_milestones" jsonb;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "fantasy_price" numeric(5, 1) DEFAULT '10.0';--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "story_group_id" uuid;--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "is_primary_story" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "original_title" text;--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "credibility_rating" varchar(20);--> statement-breakpoint
ALTER TABLE "race_predictions" ADD COLUMN "debrief" jsonb;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_race_standings" ADD CONSTRAINT "league_race_standings_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_race_standings" ADD CONSTRAINT "league_race_standings_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_race_standings" ADD CONSTRAINT "league_race_standings_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_broadcasts" ADD CONSTRAINT "session_broadcasts_race_session_id_race_sessions_id_fk" FOREIGN KEY ("race_session_id") REFERENCES "public"."race_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_broadcasts" ADD CONSTRAINT "session_broadcasts_testing_session_id_testing_sessions_id_fk" FOREIGN KEY ("testing_session_id") REFERENCES "public"."testing_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_broadcasts" ADD CONSTRAINT "session_broadcasts_channel_id_broadcast_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."broadcast_channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_events" ADD CONSTRAINT "testing_events_circuit_id_circuits_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_events" ADD CONSTRAINT "testing_events_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_results" ADD CONSTRAINT "testing_results_session_id_testing_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."testing_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_results" ADD CONSTRAINT "testing_results_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_results" ADD CONSTRAINT "testing_results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testing_sessions" ADD CONSTRAINT "testing_sessions_event_id_testing_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."testing_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_predictions" ADD CONSTRAINT "user_predictions_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_predictions" ADD CONSTRAINT "user_predictions_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_league_members_league" ON "league_members" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_league_members_user" ON "league_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_league_members_points" ON "league_members" USING btree ("league_id","total_points");--> statement-breakpoint
CREATE INDEX "idx_league_race_standings_lookup" ON "league_race_standings" USING btree ("league_id","race_id");--> statement-breakpoint
CREATE INDEX "idx_league_race_standings_member" ON "league_race_standings" USING btree ("league_member_id");--> statement-breakpoint
CREATE INDEX "idx_leagues_owner" ON "leagues" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_leagues_invite_code" ON "leagues" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "idx_leagues_season" ON "leagues" USING btree ("season_year");--> statement-breakpoint
CREATE INDEX "idx_session_broadcasts_race" ON "session_broadcasts" USING btree ("race_session_id");--> statement-breakpoint
CREATE INDEX "idx_session_broadcasts_testing" ON "session_broadcasts" USING btree ("testing_session_id");--> statement-breakpoint
CREATE INDEX "idx_session_broadcasts_channel" ON "session_broadcasts" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "idx_testing_results_session" ON "testing_results" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_testing_results_driver" ON "testing_results" USING btree ("driver_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_testing_results_unique" ON "testing_results" USING btree ("session_id","driver_id");--> statement-breakpoint
CREATE INDEX "idx_testing_sessions_event" ON "testing_sessions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "idx_user_predictions_race" ON "user_predictions" USING btree ("race_id");--> statement-breakpoint
CREATE INDEX "idx_user_predictions_member" ON "user_predictions" USING btree ("league_member_id");--> statement-breakpoint
CREATE INDEX "idx_user_predictions_locked" ON "user_predictions" USING btree ("race_id","is_locked");--> statement-breakpoint
CREATE INDEX "idx_news_articles_story_group" ON "news_articles" USING btree ("story_group_id");