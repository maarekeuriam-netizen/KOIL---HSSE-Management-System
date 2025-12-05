/*
  # HSSE App Database Schema

  ## Overview
  Creates a comprehensive database structure for Health, Safety, Security, and Environment management system.

  ## New Tables

  ### 1. `users_profile`
  Extends auth.users with HSSE-specific profile information
  - `id` (uuid, references auth.users)
  - `full_name` (text)
  - `department` (text)
  - `position` (text)
  - `employee_id` (text, unique)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `incidents`
  Records safety incidents, near misses, and hazards
  - `id` (uuid, primary key)
  - `user_id` (uuid, references users_profile)
  - `incident_type` (text) - 'injury', 'near_miss', 'hazard', 'environmental'
  - `severity` (text) - 'low', 'medium', 'high', 'critical'
  - `title` (text)
  - `description` (text)
  - `location` (text)
  - `incident_date` (timestamptz)
  - `status` (text) - 'open', 'investigating', 'resolved', 'closed'
  - `corrective_actions` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `inspections`
  Safety inspection and audit records
  - `id` (uuid, primary key)
  - `user_id` (uuid, references users_profile)
  - `inspection_type` (text) - 'routine', 'planned', 'emergency', 'audit'
  - `title` (text)
  - `location` (text)
  - `inspection_date` (timestamptz)
  - `score` (integer) - 0-100
  - `status` (text) - 'scheduled', 'in_progress', 'completed'
  - `findings` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `risk_assessments`
  Risk assessment documentation
  - `id` (uuid, primary key)
  - `user_id` (uuid, references users_profile)
  - `title` (text)
  - `activity` (text)
  - `hazard_identified` (text)
  - `likelihood` (integer) - 1-5
  - `consequence` (integer) - 1-5
  - `risk_level` (integer) - calculated
  - `control_measures` (text)
  - `status` (text) - 'draft', 'under_review', 'approved'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `training_records`
  Employee training and certification tracking
  - `id` (uuid, primary key)
  - `user_id` (uuid, references users_profile)
  - `training_name` (text)
  - `training_type` (text) - 'safety', 'environmental', 'security', 'health'
  - `completion_date` (date)
  - `expiry_date` (date)
  - `certificate_number` (text)
  - `status` (text) - 'valid', 'expiring_soon', 'expired'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can view and create their own records
  - Users can view all records for reporting purposes
  - Restrictive policies for data integrity
*/

-- Create users_profile table
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  department text DEFAULT '',
  position text DEFAULT '',
  employee_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('injury', 'near_miss', 'hazard', 'environmental')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  incident_date timestamptz NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  corrective_actions text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
  inspection_type text NOT NULL CHECK (inspection_type IN ('routine', 'planned', 'emergency', 'audit')),
  title text NOT NULL,
  location text NOT NULL,
  inspection_date timestamptz NOT NULL,
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  findings text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create risk_assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  activity text NOT NULL,
  hazard_identified text NOT NULL,
  likelihood integer NOT NULL CHECK (likelihood >= 1 AND likelihood <= 5),
  consequence integer NOT NULL CHECK (consequence >= 1 AND consequence <= 5),
  risk_level integer GENERATED ALWAYS AS (likelihood * consequence) STORED,
  control_measures text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training_records table
CREATE TABLE IF NOT EXISTS training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile(id) ON DELETE CASCADE NOT NULL,
  training_name text NOT NULL,
  training_type text NOT NULL CHECK (training_type IN ('safety', 'environmental', 'security', 'health')),
  completion_date date NOT NULL,
  expiry_date date,
  certificate_number text DEFAULT '',
  status text DEFAULT 'valid' CHECK (status IN ('valid', 'expiring_soon', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_profile
CREATE POLICY "Users can view own profile"
  ON users_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for incidents
CREATE POLICY "Users can view all incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for inspections
CREATE POLICY "Users can view all inspections"
  ON inspections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create inspections"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inspections"
  ON inspections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for risk_assessments
CREATE POLICY "Users can view all risk assessments"
  ON risk_assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create risk assessments"
  ON risk_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk assessments"
  ON risk_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for training_records
CREATE POLICY "Users can view all training records"
  ON training_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create training records"
  ON training_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training records"
  ON training_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON inspections(user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_records_user_id ON training_records(user_id);
CREATE INDEX IF NOT EXISTS idx_training_records_expiry ON training_records(expiry_date);
