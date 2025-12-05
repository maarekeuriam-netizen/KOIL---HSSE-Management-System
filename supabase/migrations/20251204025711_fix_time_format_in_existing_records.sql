/*
  # Fix Time Format in Existing Records

  1. Changes
    - Converts all decimal time values (e.g., 0.8020833333333334) to HH:MM format (e.g., 19:14)
    - Updates the inspections table time field
    - Handles decimal values that represent time as a fraction of 24 hours
  
  2. Notes
    - Only updates records where time contains decimal values
    - Preserves records that already have correct HH:MM format
*/

-- Update all decimal time values to HH:MM format
UPDATE inspections
SET time = LPAD(FLOOR(time::numeric * 24)::text, 2, '0') || ':' || 
           LPAD(ROUND((time::numeric * 24 * 60) % 60)::text, 2, '0')
WHERE time ~ '^[0-9]*\.[0-9]+$'
  AND time IS NOT NULL
  AND time != '';
