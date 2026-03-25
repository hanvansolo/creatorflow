CREATE TABLE "aggregation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'running',
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"items_processed" integer DEFAULT 0,
	"error_message" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "ai_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(100) NOT NULL,
	"analysis_type" varchar(50) NOT NULL,
	"content" text,
	"summary" text NOT NULL,
	"team_updates" jsonb,
	"driver_updates" jsonb,
	"confidence_adjustments" jsonb,
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "circuits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(50),
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"official_name" varchar(200),
	"location" varchar(100),
	"country" varchar(50) NOT NULL,
	"country_code" varchar(3),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"timezone" varchar(50),
	"length_meters" integer,
	"turns" integer,
	"drs_zones" integer,
	"lap_record_time" varchar(20),
	"lap_record_driver" varchar(100),
	"lap_record_year" integer,
	"layout_svg" text,
	"layout_image_url" text,
	"first_grand_prix_year" integer,
	"circuit_type" varchar(50),
	"direction" varchar(20),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "circuits_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "constructor_standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid,
	"team_id" uuid,
	"race_id" uuid,
	"position" integer NOT NULL,
	"points" numeric(10, 2) DEFAULT '0' NOT NULL,
	"wins" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "driver_standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid,
	"driver_id" uuid,
	"race_id" uuid,
	"position" integer NOT NULL,
	"points" numeric(10, 2) DEFAULT '0' NOT NULL,
	"wins" integer DEFAULT 0,
	"podiums" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(50),
	"code" varchar(3),
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"number" integer,
	"nationality" varchar(50),
	"date_of_birth" date,
	"place_of_birth" varchar(100),
	"current_team_id" uuid,
	"headshot_url" text,
	"helmet_image_url" text,
	"biography" text,
	"world_championships" integer DEFAULT 0,
	"race_wins" integer DEFAULT 0,
	"podiums" integer DEFAULT 0,
	"pole_positions" integer DEFAULT 0,
	"fastest_laps" integer DEFAULT 0,
	"career_points" numeric(10, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "drivers_code_unique" UNIQUE("code"),
	CONSTRAINT "drivers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid,
	"external_id" varchar(500),
	"title" text NOT NULL,
	"slug" varchar(300) NOT NULL,
	"summary" text,
	"content" text,
	"author" varchar(200),
	"image_url" text,
	"original_url" text NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now(),
	"is_breaking" boolean DEFAULT false,
	"tags" text[],
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "news_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "news_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"url" text,
	"feed_url" text,
	"logo_url" text,
	"is_active" boolean DEFAULT true,
	"fetch_interval_minutes" integer DEFAULT 15,
	"priority" integer DEFAULT 5,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "news_sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "race_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid,
	"predicted_order" jsonb NOT NULL,
	"weather_conditions" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"accuracy" jsonb
);
--> statement-breakpoint
CREATE TABLE "race_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid,
	"driver_id" uuid,
	"team_id" uuid,
	"position" integer,
	"position_text" varchar(10),
	"points" numeric(10, 2) DEFAULT '0',
	"grid_position" integer,
	"laps_completed" integer,
	"status" varchar(50),
	"time_millis" bigint,
	"fastest_lap" boolean DEFAULT false,
	"fastest_lap_time" varchar(20),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "race_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"race_id" uuid,
	"session_type" varchar(20) NOT NULL,
	"session_name" varchar(50) NOT NULL,
	"start_datetime" timestamp with time zone NOT NULL,
	"end_datetime" timestamp with time zone,
	"status" varchar(20) DEFAULT 'scheduled',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "races" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid,
	"circuit_id" uuid,
	"external_id" varchar(50),
	"round" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"official_name" varchar(200),
	"is_sprint_weekend" boolean DEFAULT false,
	"race_datetime" timestamp with time zone NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"name" varchar(50),
	"is_current" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "seasons_year_unique" UNIQUE("year")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" varchar(50),
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"full_name" varchar(200),
	"nationality" varchar(50),
	"base_location" varchar(100),
	"team_principal" varchar(100),
	"technical_director" varchar(100),
	"chassis" varchar(50),
	"power_unit" varchar(50),
	"first_entry_year" integer,
	"world_championships" integer DEFAULT 0,
	"primary_color" varchar(7),
	"secondary_color" varchar(7),
	"logo_url" text,
	"car_image_url" text,
	"website_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "weather_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circuit_id" uuid,
	"race_id" uuid,
	"recorded_at" timestamp with time zone NOT NULL,
	"temperature_celsius" numeric(5, 2),
	"track_temperature_celsius" numeric(5, 2),
	"humidity_percent" integer,
	"pressure_hpa" integer,
	"wind_speed_kph" numeric(5, 2),
	"wind_direction_degrees" integer,
	"rainfall_mm" numeric(5, 2),
	"weather_condition" varchar(50),
	"is_forecast" boolean DEFAULT false,
	"rain_probability_percent" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "youtube_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar(20) NOT NULL,
	"channel_id" varchar(30) NOT NULL,
	"channel_name" varchar(200) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"duration_seconds" integer,
	"view_count" bigint DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"published_at" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now(),
	"tags" text[],
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "youtube_videos_video_id_unique" UNIQUE("video_id")
);
--> statement-breakpoint
ALTER TABLE "constructor_standings" ADD CONSTRAINT "constructor_standings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constructor_standings" ADD CONSTRAINT "constructor_standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "constructor_standings" ADD CONSTRAINT "constructor_standings_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_standings" ADD CONSTRAINT "driver_standings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_standings" ADD CONSTRAINT "driver_standings_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_standings" ADD CONSTRAINT "driver_standings_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_current_team_id_teams_id_fk" FOREIGN KEY ("current_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_source_id_news_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."news_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_predictions" ADD CONSTRAINT "race_predictions_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "race_sessions" ADD CONSTRAINT "race_sessions_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "races" ADD CONSTRAINT "races_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "races" ADD CONSTRAINT "races_circuit_id_circuits_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_data" ADD CONSTRAINT "weather_data_circuit_id_circuits_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weather_data" ADD CONSTRAINT "weather_data_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_aggregation_jobs_lookup" ON "aggregation_jobs" USING btree ("job_type","started_at");--> statement-breakpoint
CREATE INDEX "idx_ai_analysis_created" ON "ai_analysis" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ai_analysis_type" ON "ai_analysis" USING btree ("analysis_type");--> statement-breakpoint
CREATE INDEX "idx_constructor_standings_lookup" ON "constructor_standings" USING btree ("season_id","race_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_constructor_standings_unique" ON "constructor_standings" USING btree ("season_id","team_id","race_id");--> statement-breakpoint
CREATE INDEX "idx_driver_standings_lookup" ON "driver_standings" USING btree ("season_id","race_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_driver_standings_unique" ON "driver_standings" USING btree ("season_id","driver_id","race_id");--> statement-breakpoint
CREATE INDEX "idx_news_articles_published_at" ON "news_articles" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_news_articles_source_id" ON "news_articles" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_news_articles_source_external" ON "news_articles" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "idx_race_predictions_race" ON "race_predictions" USING btree ("race_id");--> statement-breakpoint
CREATE INDEX "idx_race_predictions_created" ON "race_predictions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_race_results_unique" ON "race_results" USING btree ("race_id","driver_id");--> statement-breakpoint
CREATE INDEX "idx_race_sessions_race_id" ON "race_sessions" USING btree ("race_id");--> statement-breakpoint
CREATE INDEX "idx_race_sessions_start" ON "race_sessions" USING btree ("start_datetime");--> statement-breakpoint
CREATE INDEX "idx_weather_data_lookup" ON "weather_data" USING btree ("circuit_id","recorded_at");--> statement-breakpoint
CREATE INDEX "idx_youtube_videos_published_at" ON "youtube_videos" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "idx_youtube_videos_channel_id" ON "youtube_videos" USING btree ("channel_id");