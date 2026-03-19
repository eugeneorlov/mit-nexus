-- Add program and cohort_year fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS program TEXT DEFAULT 'Innovation Leadership';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cohort_year INTEGER DEFAULT 2026;
