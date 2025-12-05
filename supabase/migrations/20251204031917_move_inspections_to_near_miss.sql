/*
  # Move All Inspections to Near Miss Category

  1. Changes
    - Update all inspection records where inspection_type != 'audit' 
    - Set their reporting_type to 'nearmiss' to categorize them as Near Miss
    - This moves 72 inspection records into the Near Miss category
    
  2. Notes
    - Audit records (inspection_type = 'audit') remain unchanged
    - All routine, planned, and emergency inspections become Near Miss records
    - This consolidates the inspection data into the Near Miss category
*/

-- Update all non-audit inspections to be categorized as Near Miss
UPDATE inspections
SET reporting_type = 'nearmiss'
WHERE inspection_type != 'audit'
  AND (reporting_type IS NULL OR reporting_type != 'nearmiss');
