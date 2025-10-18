-- =====================================================
-- Gen-Connector Database V2 - FRESH INSTALL
-- WARNING: This will DELETE all existing data
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL EXISTING TABLES
-- =====================================================
DROP TABLE IF EXISTS generated_content CASCADE;
DROP TABLE IF EXISTS actions CASCADE;
DROP TABLE IF EXISTS turns CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_session_updated_at() CASCADE;

-- =====================================================
-- STEP 2: CREATE NEW V2 TABLES
-- =====================================================

-- =====================================================
-- 1. SESSIONS TABLE (Chat/Conversation Sessions)
-- =====================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rite_of_passage TEXT NOT NULL CHECK (rite_of_passage IN ('birth_childhood', 'coming_of_age', 'marriage', 'death')),
  
  -- Session metadata
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_duration_seconds INTEGER DEFAULT 0,
  total_segments INTEGER DEFAULT 0,
  
  -- Final outputs
  summary TEXT,
  video_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);


-- =====================================================
-- 2. SEGMENTS TABLE (30-second chunks within a session)
-- =====================================================
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Segment metadata
  segment_number INTEGER NOT NULL,
  start_time_seconds NUMERIC(10, 3) NOT NULL,
  end_time_seconds NUMERIC(10, 3) NOT NULL,
  duration_seconds NUMERIC(10, 3) NOT NULL,
  
  -- Audio & processing
  audio_url TEXT,
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- AI Analysis
  ai_summary TEXT,
  ai_action_type TEXT CHECK (ai_action_type IN ('song_search', 'image_search', 'image_generation', 'none')),
  ai_action_status TEXT DEFAULT 'pending' CHECK (ai_action_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_segments_session_id ON segments(session_id);
CREATE INDEX idx_segments_segment_number ON segments(session_id, segment_number);


-- =====================================================
-- 3. TURNS TABLE (Individual speaker turns within a segment)
-- =====================================================
CREATE TABLE turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Speaker identification
  speaker TEXT NOT NULL CHECK (speaker IN ('elderly', 'young_adult')),
  speaker_id TEXT,
  
  -- Content
  transcript TEXT NOT NULL,
  
  -- Timing within segment
  start_time_seconds NUMERIC(10, 3) NOT NULL,
  end_time_seconds NUMERIC(10, 3) NOT NULL,
  confidence NUMERIC(3, 2) DEFAULT 0.5,
  
  -- Metadata
  turn_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_turns_segment_id ON turns(segment_id);
CREATE INDEX idx_turns_session_id ON turns(session_id);
CREATE INDEX idx_turns_speaker ON turns(speaker);
CREATE INDEX idx_turns_turn_number ON turns(segment_id, turn_number);


-- =====================================================
-- 4. ACTIONS TABLE (AI-triggered actions per segment)
-- =====================================================
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Action type and priority
  action_type TEXT NOT NULL CHECK (action_type IN ('song_search', 'image_search', 'image_generation')),
  priority INTEGER NOT NULL,
  
  -- AI extracted keywords
  keywords JSONB,
  
  -- Action result
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_url TEXT,
  result_metadata JSONB,
  
  -- Error handling
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_actions_segment_id ON actions(segment_id);
CREATE INDEX idx_actions_session_id ON actions(session_id);
CREATE INDEX idx_actions_action_type ON actions(action_type);


-- =====================================================
-- 5. GENERATED_CONTENT TABLE (For images, videos, songs)
-- =====================================================
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
  
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'song')),
  url TEXT NOT NULL,
  prompt TEXT,
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_generated_content_session_id ON generated_content(session_id);
CREATE INDEX idx_generated_content_segment_id ON generated_content(segment_id);


-- =====================================================
-- STEP 3: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Segments policies
CREATE POLICY "Users can view own segments" ON segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = segments.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own segments" ON segments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = segments.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own segments" ON segments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = segments.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own segments" ON segments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = segments.session_id AND sessions.user_id = auth.uid()
    )
  );

-- Turns policies
CREATE POLICY "Users can view own turns" ON turns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = turns.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own turns" ON turns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = turns.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own turns" ON turns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = turns.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own turns" ON turns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = turns.session_id AND sessions.user_id = auth.uid()
    )
  );

-- Actions policies
CREATE POLICY "Users can view own actions" ON actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = actions.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own actions" ON actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = actions.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own actions" ON actions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = actions.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own actions" ON actions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = actions.session_id AND sessions.user_id = auth.uid()
    )
  );

-- Generated Content policies
CREATE POLICY "Users can view own generated_content" ON generated_content
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = generated_content.session_id AND sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own generated_content" ON generated_content
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = generated_content.session_id AND sessions.user_id = auth.uid()
    )
  );


-- =====================================================
-- STEP 4: HELPER FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to auto-update session timestamp
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions 
  SET updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for segments
CREATE TRIGGER trigger_update_session_on_segment_change
AFTER INSERT OR UPDATE ON segments
FOR EACH ROW
EXECUTE FUNCTION update_session_updated_at();

-- Trigger for turns
CREATE TRIGGER trigger_update_session_on_turn_change
AFTER INSERT OR UPDATE ON turns
FOR EACH ROW
EXECUTE FUNCTION update_session_updated_at();


-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('sessions', 'segments', 'turns', 'actions', 'generated_content');
  
  IF table_count = 5 THEN
    RAISE NOTICE '✅ SUCCESS: All 5 tables created successfully!';
    RAISE NOTICE '   - sessions';
    RAISE NOTICE '   - segments';
    RAISE NOTICE '   - turns';
    RAISE NOTICE '   - actions';
    RAISE NOTICE '   - generated_content';
  ELSE
    RAISE WARNING '⚠️ WARNING: Expected 5 tables, found %', table_count;
  END IF;
END $$;

