/*
  # Add Detailed Inspection Fields

  1. Changes to inspections table
    - Add `time` field for inspection time
    - Add `reported_by` field for person reporting
    - Add `location_id` field for location identifier
    - Add `issue` field for detailed issue description
    - Add `reporting_type` field (e.g., Nearmiss, Incident)
    - Add `action_taken` field for actions taken
    - Add `recommendation` field for recommendations
    - Add `responsible_staff` field for assigned staff
    - Add `target_date` field for completion target
    - Add `inspector` field for inspector name
    
  2. Purpose
    - Enable storage of complete inspection/audit data from Excel imports
    - Support detailed reporting and tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'time'
  ) THEN
    ALTER TABLE inspections ADD COLUMN time text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'reported_by'
  ) THEN
    ALTER TABLE inspections ADD COLUMN reported_by text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE inspections ADD COLUMN location_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'issue'
  ) THEN
    ALTER TABLE inspections ADD COLUMN issue text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'reporting_type'
  ) THEN
    ALTER TABLE inspections ADD COLUMN reporting_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'action_taken'
  ) THEN
    ALTER TABLE inspections ADD COLUMN action_taken text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'recommendation'
  ) THEN
    ALTER TABLE inspections ADD COLUMN recommendation text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'responsible_staff'
  ) THEN
    ALTER TABLE inspections ADD COLUMN responsible_staff text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'target_date'
  ) THEN
    ALTER TABLE inspections ADD COLUMN target_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inspections' AND column_name = 'inspector'
  ) THEN
    ALTER TABLE inspections ADD COLUMN inspector text DEFAULT '';
  END IF;
END $$;
