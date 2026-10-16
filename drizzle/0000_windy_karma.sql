CREATE TABLE `readings` (
	`record_date` text PRIMARY KEY NOT NULL,
	`source_url` text NOT NULL,
	`source_observed_at` text NOT NULL,
	`fetched_at` text NOT NULL,
	`normalized_value` real NOT NULL,
	`unit` text NOT NULL,
	`raw_json` text NOT NULL
);
