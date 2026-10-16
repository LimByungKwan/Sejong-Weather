import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
export const readings = sqliteTable('readings', {
 record_date: text('record_date').primaryKey(),
 source_url: text('source_url').notNull(),
 source_observed_at: text('source_observed_at').notNull(),
 fetched_at: text('fetched_at').notNull(),
 normalized_value: real('normalized_value').notNull(),
 unit: text('unit').notNull(),
 raw_json: text('raw_json').notNull(),
});
