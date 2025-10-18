-- =====================================================
-- Database Migration: Update Route Names
-- Purpose: Add new category routes to sessions table
-- Date: 2025-10-18
-- =====================================================

-- Step 1: Drop the existing CHECK constraint on rite_of_passage
ALTER TABLE sessions 
DROP CONSTRAINT IF EXISTS sessions_rite_of_passage_check;

-- Step 2: Add new CHECK constraint with both old and new route names
ALTER TABLE sessions 
ADD CONSTRAINT sessions_rite_of_passage_check 
CHECK (rite_of_passage IN (
  -- New routes (primary)
  'childhood',
  'school-life', 
  'work-life',
  'relationships',
  'hobbies',
  'community',
  -- Old routes (legacy support)
  'birth_childhood',
  'coming_of_age',
  'marriage',
  'death'
));

-- Step 3: Update existing data to use new route names (if any exists)
UPDATE sessions SET rite_of_passage = 'childhood' WHERE rite_of_passage = 'birth_childhood';
UPDATE sessions SET rite_of_passage = 'work-life' WHERE rite_of_passage = 'coming_of_age';
UPDATE sessions SET rite_of_passage = 'relationships' WHERE rite_of_passage = 'marriage';
UPDATE sessions SET rite_of_passage = 'school-life' WHERE rite_of_passage = 'death';

-- Verification query (optional - uncomment to see current values)
-- SELECT DISTINCT rite_of_passage FROM sessions;

COMMENT ON COLUMN sessions.rite_of_passage IS 'The life topic category: childhood, school-life, work-life, relationships, hobbies, or community';

