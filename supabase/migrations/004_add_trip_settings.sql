-- Consolidates all per-trip client settings into one JSONB column.
-- Keys: attraction_hours, attraction_costs, attraction_ratings,
--       physical_profiles, visited_attractions, day_notes, leg_transport
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_settings JSONB DEFAULT '{}';
