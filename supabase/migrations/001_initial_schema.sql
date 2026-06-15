-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    destination_city TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    traveler_profile TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create attractions table
CREATE TABLE IF NOT EXISTS attractions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    osm_id BIGINT,
    name TEXT NOT NULL,
    category TEXT,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    rating FLOAT DEFAULT 0,
    visit_duration_minutes INTEGER DEFAULT 60,
    city TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create itineraries table
CREATE TABLE IF NOT EXISTS itineraries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    attraction_id UUID NOT NULL REFERENCES attractions(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    order_in_day INTEGER NOT NULL,
    start_time TIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination_city);
CREATE INDEX IF NOT EXISTS idx_attractions_city ON attractions(city);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);
CREATE INDEX IF NOT EXISTS idx_itineraries_trip_id ON itineraries(trip_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_day ON itineraries(trip_id, day_number);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies for trips
CREATE POLICY "Users can view own trips" ON trips
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create trips" ON trips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for itineraries
CREATE POLICY "Users can view own itineraries" ON itineraries
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM trips WHERE trips.id = itineraries.trip_id)
    );

CREATE POLICY "Users can manage own itineraries" ON itineraries
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM trips WHERE trips.id = itineraries.trip_id)
    );

CREATE POLICY "Users can update own itineraries" ON itineraries
    FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM trips WHERE trips.id = itineraries.trip_id)
    );

CREATE POLICY "Users can delete own itineraries" ON itineraries
    FOR DELETE USING (
        auth.uid() = (SELECT user_id FROM trips WHERE trips.id = itineraries.trip_id)
    );
