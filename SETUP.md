# Intergenerational Voice Storytelling - Setup Guide

## 🚀 Quick Start

### 1. Environment Variables Setup

Copy the `.env.example` file to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

### 2. Required API Keys

#### **Supabase (Database & Storage)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use existing one
3. Go to Settings → API
4. Copy the following values to your `.env`:
   - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon/Public Key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (for server-side operations)

#### **OpenAI (AI Features)**

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key to your `.env`:
   - `OPENAI_API_KEY` - Your OpenAI API key

### 3. Database Setup

Run these SQL commands in your Supabase SQL Editor to create the required tables:

```sql
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
```

### 4. Storage Buckets Setup

In your Supabase dashboard, go to Storage and create these buckets:

1. **audio-recordings** - For storing voice recordings
2. **generated-images** - For AI-generated images
3. **generated-videos** - For final video outputs
4. **archive-images** - For cached archival images

Set all buckets to **Public** for easy access.

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 🎯 Features Overview

### ✅ **Completed Features:**

1. **Voice Recording & Transcription**

   - Real-time audio recording with Web Audio API
   - OpenAI Whisper integration for speech-to-text
   - Smart speaker identification (elderly vs young adult)

2. **AI-Powered Conversation Flow**

   - Context-aware prompt generation using GPT-4
   - Dynamic follow-up questions based on conversation history
   - Intelligent conversation management

3. **Historical Image Integration**

   - Singapore National Archives search (mock implementation)
   - AI image generation with DALL-E 3
   - Contextual image display based on conversation themes

4. **Video Generation**

   - Slideshow video creation from conversation and images
   - Multiple transition effects (fade, slide, zoom)
   - Audio overlay support (framework ready)

5. **Storage & Database**
   - Supabase integration for data persistence
   - File storage for audio, images, and videos
   - Session management and conversation history

### 🔄 **In Progress:**

- Authentication system
- Session dashboard
- Generalization to all rites of passage

## 🛠️ Technical Architecture

### **Frontend:**

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- React hooks for state management

### **Backend:**

- Next.js API routes
- Supabase for database and storage
- OpenAI API for AI features

### **Key Components:**

- `VoiceRecorder` - Audio recording interface
- `ConversationInterface` - Main conversation flow
- `ImageGallery` - Historical image display
- `VideoGenerator` - Slideshow creation

## 📱 Mobile-First Design

The app is optimized for:

- **Mobile phones** - Primary target
- **Tablets** - Landscape and portrait modes
- **Desktop** - Full responsive experience

## 🔧 Development Notes

### **Environment Variables:**

All required environment variables are documented in `.env.example`. Make sure to:

1. Copy `.env.example` to `.env`
2. Fill in your actual API keys
3. Never commit `.env` to version control

### **API Rate Limits:**

- OpenAI API has usage limits based on your plan
- Consider implementing request throttling for production
- Monitor usage in OpenAI dashboard

### **Browser Compatibility:**

- Requires modern browsers with Web Audio API support
- iOS Safari requires user gesture for microphone access
- Chrome, Firefox, Safari, Edge all supported

## 🚀 Deployment

### **Vercel (Recommended):**

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Environment Variables for Production:**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 🆘 Troubleshooting

### **Common Issues:**

1. **Microphone Permission Denied**

   - Ensure HTTPS in production
   - Check browser permissions
   - Try refreshing the page

2. **Transcription Fails**

   - Check OpenAI API key
   - Verify audio format (WebM/Opus)
   - Check network connection

3. **Images Not Loading**

   - Verify Supabase storage buckets are public
   - Check CORS settings
   - Ensure image URLs are accessible

4. **Database Errors**
   - Verify Supabase connection
   - Check RLS policies
   - Ensure tables are created correctly

### **Debug Mode:**

Add `NODE_ENV=development` to see detailed error messages in the console.

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the console for error messages
3. Verify all environment variables are set correctly
4. Ensure all API keys have proper permissions

---

**Happy storytelling! 🎤📸🎬**
