CREATE TABLE IF NOT EXISTS "request_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"country" varchar(4),
	"ip_hash" varchar(16),
	"ua" text,
	"path" varchar(500),
	"method" varchar(8),
	"referer" text,
	"accept_language" varchar(200),
	"cf_ray" varchar(50),
	"blocked" boolean DEFAULT false,
	"reason" varchar(50)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_request_samples_created" ON "request_samples" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_request_samples_country" ON "request_samples" USING btree ("country","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_request_samples_ip" ON "request_samples" USING btree ("ip_hash","created_at");
