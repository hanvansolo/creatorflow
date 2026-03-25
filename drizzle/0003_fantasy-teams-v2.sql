CREATE TABLE "driver_track_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid NOT NULL,
	"circuit_id" uuid NOT NULL,
	"overall_rating" integer,
	"qualifying_strength" integer,
	"race_pace_strength" integer,
	"overtaking_ability" integer,
	"tyre_management" integer,
	"wet_weather_rating" integer,
	"strength_description" text,
	"weakness_description" text,
	"prediction_notes" text,
	"confidence_level" varchar(20),
	"average_finish" numeric(4, 2),
	"best_finish" integer,
	"dnf_rate" numeric(5, 2),
	"races_at_circuit" integer DEFAULT 0,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fantasy_team_drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_team_id" uuid NOT NULL,
	"driver_id" uuid NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT now(),
	"acquired_price" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"is_active" boolean DEFAULT true,
	"dropped_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fantasy_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_member_id" uuid NOT NULL,
	"season_year" integer DEFAULT 2026 NOT NULL,
	"budget" numeric(10, 2) DEFAULT '100.00' NOT NULL,
	"total_winnings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"constructor_points" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fantasy_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fantasy_team_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"driver_id" uuid,
	"race_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "driver_track_performance" ADD CONSTRAINT "driver_track_performance_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_track_performance" ADD CONSTRAINT "driver_track_performance_circuit_id_circuits_id_fk" FOREIGN KEY ("circuit_id") REFERENCES "public"."circuits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_drivers" ADD CONSTRAINT "fantasy_team_drivers_fantasy_team_id_fantasy_teams_id_fk" FOREIGN KEY ("fantasy_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_team_drivers" ADD CONSTRAINT "fantasy_team_drivers_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_teams" ADD CONSTRAINT "fantasy_teams_league_member_id_league_members_id_fk" FOREIGN KEY ("league_member_id") REFERENCES "public"."league_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_transactions" ADD CONSTRAINT "fantasy_transactions_fantasy_team_id_fantasy_teams_id_fk" FOREIGN KEY ("fantasy_team_id") REFERENCES "public"."fantasy_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_transactions" ADD CONSTRAINT "fantasy_transactions_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fantasy_transactions" ADD CONSTRAINT "fantasy_transactions_race_id_races_id_fk" FOREIGN KEY ("race_id") REFERENCES "public"."races"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_driver_track_perf_unique" ON "driver_track_performance" USING btree ("driver_id","circuit_id");--> statement-breakpoint
CREATE INDEX "idx_driver_track_perf_circuit" ON "driver_track_performance" USING btree ("circuit_id");--> statement-breakpoint
CREATE INDEX "idx_fantasy_team_drivers_team" ON "fantasy_team_drivers" USING btree ("fantasy_team_id");--> statement-breakpoint
CREATE INDEX "idx_fantasy_team_drivers_driver" ON "fantasy_team_drivers" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "idx_fantasy_teams_member" ON "fantasy_teams" USING btree ("league_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fantasy_teams_unique" ON "fantasy_teams" USING btree ("league_member_id","season_year");--> statement-breakpoint
CREATE INDEX "idx_fantasy_transactions_team" ON "fantasy_transactions" USING btree ("fantasy_team_id");--> statement-breakpoint
CREATE INDEX "idx_fantasy_transactions_race" ON "fantasy_transactions" USING btree ("race_id");