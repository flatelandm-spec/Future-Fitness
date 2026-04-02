-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/zlljdejkamnvddmqojfq/sql

CREATE TABLE IF NOT EXISTS members (
  athlete_id       BIGINT PRIMARY KEY,
  name             TEXT NOT NULL,
  access_token     TEXT NOT NULL,
  refresh_token    TEXT NOT NULL,
  token_expires_at BIGINT NOT NULL,
  profile_photo    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  strava_id      BIGINT PRIMARY KEY,
  athlete_id     BIGINT NOT NULL REFERENCES members(athlete_id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  distance_m     FLOAT NOT NULL DEFAULT 0,
  moving_time_s  INT NOT NULL DEFAULT 0,
  elevation_m    FLOAT NOT NULL DEFAULT 0,
  type           TEXT NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_athlete_id_idx ON activities(athlete_id);
CREATE INDEX IF NOT EXISTS activities_date_idx ON activities(date);
