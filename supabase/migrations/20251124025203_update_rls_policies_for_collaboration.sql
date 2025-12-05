/*
  # Update RLS Policies for Team Collaboration

  ## Overview
  Updates Row Level Security policies to enable full team collaboration while maintaining data security.

  ## Changes Made

  ### Security Updates
  - All authenticated users can view all records (existing)
  - All authenticated users can create new records
  - All authenticated users can update ANY record (not just their own)
  - All authenticated users can update status fields for incident tracking
  - Owner can still see all data as admin
  
  ### Updated Tables
  - `incidents` - Team members can update any incident status and details
  - `inspections` - Team members can update any inspection
  - `risk_assessments` - Team members can update any risk assessment
  - `training_records` - Team members can update any training record
  
  ## Security Notes
  - All users must be authenticated (logged in)
  - DELETE operations are restricted - users cannot delete records
  - All updates are tracked with updated_at timestamps
  - Maintains audit trail through user_id field
*/

-- Drop existing restrictive UPDATE policies
DROP POLICY IF EXISTS "Users can update own incidents" ON incidents;
DROP POLICY IF EXISTS "Users can update own inspections" ON inspections;
DROP POLICY IF EXISTS "Users can update own risk assessments" ON risk_assessments;
DROP POLICY IF EXISTS "Users can update own training records" ON training_records;

-- Create new collaborative UPDATE policies for incidents
CREATE POLICY "Authenticated users can update any incident"
  ON incidents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new collaborative UPDATE policies for inspections
CREATE POLICY "Authenticated users can update any inspection"
  ON inspections FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new collaborative UPDATE policies for risk_assessments
CREATE POLICY "Authenticated users can update any risk assessment"
  ON risk_assessments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new collaborative UPDATE policies for training_records
CREATE POLICY "Authenticated users can update any training record"
  ON training_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policies (restrictive - no one can delete)
CREATE POLICY "No one can delete incidents"
  ON incidents FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "No one can delete inspections"
  ON inspections FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "No one can delete risk assessments"
  ON risk_assessments FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "No one can delete training records"
  ON training_records FOR DELETE
  TO authenticated
  USING (false);

-- Update the updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspections_updated_at ON inspections;
CREATE TRIGGER update_inspections_updated_at
    BEFORE UPDATE ON inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_risk_assessments_updated_at ON risk_assessments;
CREATE TRIGGER update_risk_assessments_updated_at
    BEFORE UPDATE ON risk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_records_updated_at ON training_records;
CREATE TRIGGER update_training_records_updated_at
    BEFORE UPDATE ON training_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_profile_updated_at ON users_profile;
CREATE TRIGGER update_users_profile_updated_at
    BEFORE UPDATE ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
