/*
  # Add Additional Fields to Incidents Table
  
  1. New Columns Added
    - `ref_no` (text) - Reference number for the incident (e.g., C001, D001)
    - `reporter` (text) - Name of person who reported the incident
    - `root_cause` (text) - Root cause analysis of the incident
    - `impact` (text) - Impact description of the incident
    - `recommendations` (text) - Recommendations for preventing future incidents
    - `time` (text) - Time when incident occurred
  
  2. Purpose
    - Support comprehensive incident data import from Excel
    - Match standard incident reporting format with Ref No, Reporter, Root Cause, Impact, and Recommendations
*/

-- Add new columns to incidents table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'ref_no'
  ) THEN
    ALTER TABLE incidents ADD COLUMN ref_no text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'reporter'
  ) THEN
    ALTER TABLE incidents ADD COLUMN reporter text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'root_cause'
  ) THEN
    ALTER TABLE incidents ADD COLUMN root_cause text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'impact'
  ) THEN
    ALTER TABLE incidents ADD COLUMN impact text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'recommendations'
  ) THEN
    ALTER TABLE incidents ADD COLUMN recommendations text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'time'
  ) THEN
    ALTER TABLE incidents ADD COLUMN time text;
  END IF;
END $$;