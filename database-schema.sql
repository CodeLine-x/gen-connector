-- Sessions table
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rite_of_passage TEXT NOT NULL CHECK (rite_of_passage IN ('birth-childhood', 'coming-of-age', 'marriage', 'death')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  title TEXT,
  summary TEXT
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  speaker_role TEXT NOT NULL CHECK (speaker_role IN ('elderly', 'young_adult')),
  transcript TEXT NOT NULL,
  audio_url TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated content table
CREATE TABLE generated_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video')),
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Create policies (users can only access their own data)
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (
  session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (
  session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view own generated content" ON generated_content FOR SELECT USING (
  session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own generated content" ON generated_content FOR INSERT WITH CHECK (
  session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
);
