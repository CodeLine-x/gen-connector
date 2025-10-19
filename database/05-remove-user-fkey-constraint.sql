-- =====================================================
-- Remove Foreign Key Constraint for Anonymous Users
-- Purpose: Allow sessions to be created without requiring user to exist in auth.users
-- Date: 2025
-- =====================================================

-- Step 1: Drop the foreign key constraint
ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;

-- Step 2: Keep user_id but make it more flexible (it's already nullable from the original schema)
-- The user_id can now be:
--   - A real Supabase auth.users(id) for authenticated users
--   - A generated UUID for anonymous users
--   - NULL (though we'll always provide a UUID)

-- Step 3: Add a helpful index on user_id for performance
-- (This may already exist, so we use IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'sessions' 
    AND indexname = 'idx_sessions_user_id'
  ) THEN
    CREATE INDEX idx_sessions_user_id ON sessions(user_id);
  END IF;
END $$;

-- Step 4: Add a comment explaining the new behavior
COMMENT ON COLUMN sessions.user_id IS 'User identifier - can be auth.users(id) for authenticated users or a generated UUID for anonymous users';

-- Verification
DO $$
DECLARE
  fkey_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sessions_user_id_fkey'
    AND table_name = 'sessions'
  ) INTO fkey_exists;
  
  IF NOT fkey_exists THEN
    RAISE NOTICE '✅ SUCCESS: Foreign key constraint removed!';
    RAISE NOTICE '   Sessions can now be created with anonymous user IDs';
    RAISE NOTICE '   user_id can be: authenticated user ID OR anonymous UUID';
  ELSE
    RAISE WARNING '⚠️ Foreign key constraint still exists!';
  END IF;
END $$;

-- Optional: Test with a sample anonymous user
-- Uncomment to test:
/*
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_session_id UUID;
BEGIN
  INSERT INTO sessions (user_id, rite_of_passage, status)
  VALUES (test_user_id, 'childhood', 'active')
  RETURNING id INTO test_session_id;
  
  RAISE NOTICE '✅ Test session created with anonymous user ID: %', test_session_id;
  
  -- Clean up test data
  DELETE FROM sessions WHERE id = test_session_id;
  RAISE NOTICE '✅ Test data cleaned up';
END $$;
*/

