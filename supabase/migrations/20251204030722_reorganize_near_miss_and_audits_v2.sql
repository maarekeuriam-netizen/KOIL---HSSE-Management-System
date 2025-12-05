/*
  # Reorganize Near Miss and Audits with Proper Status

  1. Changes
    - Update status values in inspections table to match: open, in_progress, closed
    - Map existing status values:
      - scheduled → open
      - in_progress → in_progress (unchanged)
      - completed → closed
    
  2. Notes
    - Inspections table will now contain both Near Miss and Audits
    - Near Miss: inspection_type = 'routine', 'planned', 'emergency'
    - Audits: inspection_type = 'audit'
    - Status values now match: open, in_progress, closed
*/

-- First, drop the existing constraint
ALTER TABLE inspections 
  DROP CONSTRAINT IF EXISTS inspections_status_check;

-- Update existing status values to match new scheme
UPDATE inspections
SET status = CASE 
  WHEN status = 'scheduled' THEN 'open'
  WHEN status = 'completed' THEN 'closed'
  WHEN status = 'in_progress' THEN 'in_progress'
  ELSE 'open'
END;

-- Add the new status constraint
ALTER TABLE inspections 
  ADD CONSTRAINT inspections_status_check 
  CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'closed'::text]));

-- Update the default value for new records
ALTER TABLE inspections 
  ALTER COLUMN status SET DEFAULT 'open'::text;
