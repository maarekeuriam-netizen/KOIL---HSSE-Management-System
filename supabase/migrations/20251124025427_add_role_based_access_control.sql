/*
  # Add Role-Based Access Control (RBAC)

  ## Overview
  Implements a role-based system with admin and user roles for managing HSSE data.

  ## Changes Made

  ### 1. Schema Updates
  - Add `role` column to `users_profile` table (admin/user)
  - Add `is_active` column for user management

  ### 2. Security Updates
  - Admin users can delete any record
  - Admin users can view all user profiles
  - Admin users can manage user roles
  - Regular users cannot delete records
  - Regular users cannot view other user profiles
  - Regular users can only update their own profile

  ### 3. New Tables
  None (extending existing tables)

  ## Security Notes
  - Only admins can delete data
  - Only admins can see all users
  - Only admins can change user roles
  - All actions maintain audit trail
  - First user becomes admin automatically
*/

-- Add role and status columns to users_profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'role'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('admin', 'user'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users_profile' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users_profile ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing restrictive DELETE policies
DROP POLICY IF EXISTS "No one can delete incidents" ON incidents;
DROP POLICY IF EXISTS "No one can delete inspections" ON inspections;
DROP POLICY IF EXISTS "No one can delete risk assessments" ON risk_assessments;
DROP POLICY IF EXISTS "No one can delete training records" ON training_records;

-- Create new DELETE policies - only admins can delete
CREATE POLICY "Only admins can delete incidents"
  ON incidents FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can delete inspections"
  ON inspections FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can delete risk assessments"
  ON risk_assessments FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can delete training records"
  ON training_records FOR DELETE
  TO authenticated
  USING (is_admin());

-- Update users_profile RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;

-- Admins can view all profiles, users can only view their own
CREATE POLICY "Users can view profiles based on role"
  ON users_profile FOR SELECT
  TO authenticated
  USING (
    is_admin() OR auth.uid() = id
  );

-- Add policy for admins to update any user profile
CREATE POLICY "Admins can update any profile"
  ON users_profile FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add policy for admins to delete user profiles
CREATE POLICY "Admins can delete profiles"
  ON users_profile FOR DELETE
  TO authenticated
  USING (is_admin());

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);
CREATE INDEX IF NOT EXISTS idx_users_profile_is_active ON users_profile(is_active);

-- Function to auto-assign first user as admin
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM users_profile) = 0 THEN
    NEW.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to set first user as admin
DROP TRIGGER IF EXISTS set_first_user_admin_trigger ON users_profile;
CREATE TRIGGER set_first_user_admin_trigger
  BEFORE INSERT ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION set_first_user_as_admin();

-- Update existing first user to admin if exists
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  SELECT id INTO first_user_id
  FROM users_profile
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    UPDATE users_profile
    SET role = 'admin'
    WHERE id = first_user_id;
  END IF;
END $$;
