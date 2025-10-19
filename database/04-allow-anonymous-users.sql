-- =====================================================
-- Allow Anonymous Users to Access App
-- Purpose: Update RLS policies to allow anonymous users (non-authenticated)
-- Date: 2025
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

-- Create new permissive policies that allow both authenticated and anonymous users
-- Sessions policies - Allow all operations for prototype/testing
CREATE POLICY "Allow all to view sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert sessions" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update sessions" ON sessions
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete sessions" ON sessions
  FOR DELETE USING (true);

-- Update segments policies to be more permissive
DROP POLICY IF EXISTS "Users can view own segments" ON segments;
DROP POLICY IF EXISTS "Users can insert own segments" ON segments;
DROP POLICY IF EXISTS "Users can update own segments" ON segments;
DROP POLICY IF EXISTS "Users can delete own segments" ON segments;

CREATE POLICY "Allow all to view segments" ON segments
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert segments" ON segments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update segments" ON segments
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete segments" ON segments
  FOR DELETE USING (true);

-- Update turns policies
DROP POLICY IF EXISTS "Users can view own turns" ON turns;
DROP POLICY IF EXISTS "Users can insert own turns" ON turns;
DROP POLICY IF EXISTS "Users can update own turns" ON turns;
DROP POLICY IF EXISTS "Users can delete own turns" ON turns;

CREATE POLICY "Allow all to view turns" ON turns
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert turns" ON turns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update turns" ON turns
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete turns" ON turns
  FOR DELETE USING (true);

-- Update actions policies
DROP POLICY IF EXISTS "Users can view own actions" ON actions;
DROP POLICY IF EXISTS "Users can insert own actions" ON actions;
DROP POLICY IF EXISTS "Users can update own actions" ON actions;
DROP POLICY IF EXISTS "Users can delete own actions" ON actions;

CREATE POLICY "Allow all to view actions" ON actions
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert actions" ON actions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all to update actions" ON actions
  FOR UPDATE USING (true);

CREATE POLICY "Allow all to delete actions" ON actions
  FOR DELETE USING (true);

-- Update generated_content policies
DROP POLICY IF EXISTS "Users can view own generated_content" ON generated_content;
DROP POLICY IF EXISTS "Users can insert own generated_content" ON generated_content;

CREATE POLICY "Allow all to view generated_content" ON generated_content
  FOR SELECT USING (true);

CREATE POLICY "Allow all to insert generated_content" ON generated_content
  FOR INSERT WITH CHECK (true);

-- Verification
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename IN ('sessions', 'segments', 'turns', 'actions', 'generated_content')
  AND policyname LIKE 'Allow all%';
  
  IF policy_count >= 10 THEN
    RAISE NOTICE '✅ SUCCESS: RLS policies updated to allow anonymous users!';
    RAISE NOTICE '   Anonymous users can now create and access sessions';
  ELSE
    RAISE WARNING '⚠️ Some policies may not have been created. Expected at least 10, found %', policy_count;
  END IF;
END $$;

-- Optional: Add comment explaining the permissive setup
COMMENT ON TABLE sessions IS 'Open access for prototyping - both authenticated and anonymous users can create sessions';

