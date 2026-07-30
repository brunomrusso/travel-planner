-- Add day_accommodation JSONB column to trips table
-- Stores hotel/accommodation data per day: {"1": {"name": "...", "address": "...", "lat": ..., "lng": ...}}
ALTER TABLE trips ADD COLUMN IF NOT EXISTS day_accommodation JSONB DEFAULT '{}';
