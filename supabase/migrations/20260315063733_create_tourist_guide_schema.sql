/*
  # Tourist Guide App Database Schema

  ## Overview
  This migration creates the complete database schema for a tourist guide application
  with authentication, location management, and reward system.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email
  - `full_name` (text) - User's full name
  - `avatar_url` (text, nullable) - Profile picture URL
  - `reward_points` (integer) - Current reward points balance
  - `total_visits` (integer) - Total locations visited
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. categories
  - `id` (uuid, primary key) - Unique category identifier
  - `name` (text) - Category name (mountains, beaches, etc.)
  - `icon` (text) - Icon name for display
  - `description` (text) - Category description
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. locations
  - `id` (uuid, primary key) - Unique location identifier
  - `name` (text) - Location name
  - `description` (text) - Detailed description
  - `state` (text) - Indian state
  - `city` (text) - City name
  - `category_id` (uuid) - Foreign key to categories
  - `latitude` (numeric) - GPS latitude
  - `longitude` (numeric) - GPS longitude
  - `image_url` (text) - Main image URL
  - `rating` (numeric) - Average rating (0-5)
  - `visit_count` (integer) - Number of visits
  - `best_season` (text) - Best time to visit
  - `created_at` (timestamptz) - Creation timestamp

  ### 4. user_visits
  - `id` (uuid, primary key) - Unique visit identifier
  - `user_id` (uuid) - Foreign key to profiles
  - `location_id` (uuid) - Foreign key to locations
  - `visited_at` (timestamptz) - Visit timestamp
  - `points_earned` (integer) - Points earned from visit
  - `rating` (integer, nullable) - User's rating (1-5)

  ### 5. user_favorites
  - `id` (uuid, primary key) - Unique favorite identifier
  - `user_id` (uuid) - Foreign key to profiles
  - `location_id` (uuid) - Foreign key to locations
  - `created_at` (timestamptz) - When favorited

  ## Security
  - Enable RLS on all tables
  - Profiles: Users can read their own profile and update their own data
  - Categories: Public read access, no write access for regular users
  - Locations: Public read access, no write access for regular users
  - User visits: Users can read/write their own visits
  - User favorites: Users can read/write their own favorites

  ## Indexes
  - Index on locations.state for efficient state-based queries
  - Index on locations.category_id for category filtering
  - Index on user_visits.user_id and location_id for quick lookups
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text,
  reward_points integer DEFAULT 0,
  total_visits integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  state text NOT NULL,
  city text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  latitude numeric,
  longitude numeric,
  image_url text NOT NULL,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  visit_count integer DEFAULT 0,
  best_season text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are publicly readable"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category_id);

-- Create user_visits table
CREATE TABLE IF NOT EXISTS user_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  visited_at timestamptz DEFAULT now(),
  points_earned integer DEFAULT 10,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(user_id, location_id)
);

ALTER TABLE user_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own visits"
  ON user_visits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visits"
  ON user_visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own visits"
  ON user_visits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visits"
  ON user_visits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, location_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    total_visits = total_visits + 1,
    reward_points = reward_points + NEW.points_earned,
    updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update profile stats on visit
DROP TRIGGER IF EXISTS trigger_update_profile_stats ON user_visits;
CREATE TRIGGER trigger_update_profile_stats
  AFTER INSERT ON user_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_stats();

-- Create function to update location visit count
CREATE OR REPLACE FUNCTION update_location_visit_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE locations
  SET visit_count = visit_count + 1
  WHERE id = NEW.location_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update location visit count
DROP TRIGGER IF EXISTS trigger_update_location_visit_count ON user_visits;
CREATE TRIGGER trigger_update_location_visit_count
  AFTER INSERT ON user_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_location_visit_count();