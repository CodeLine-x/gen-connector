# Intergenerational Voice Storytelling System

## 🚀 Quick Start

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project
3. OpenAI API key

### Setup Steps

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   - Copy `.env.example` to `.env`
   - Fill in your Supabase and OpenAI credentials

3. **Set up database:**

   - Follow the instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
   - Run `database-schema.sql` in your Supabase SQL Editor

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open the app:**
   - Visit `http://localhost:3000`
   - Sign up or sign in to start

## 📚 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Complete Supabase setup guide
- **[database-schema.sql](./database-schema.sql)** - Database schema

---

## Phase 1: Foundation & Audio Infrastructure

### 1.1 Dependencies & Environment Setup ✅

- ✅ Add dependencies: `@supabase/supabase-js`, `openai`, `@supabase/ssr`
- ✅ Create `.env.example` with placeholders for:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
- ✅ Add `.env` to `.gitignore`

### 1.2 Supabase Configuration ✅

- ✅ Create `/src/lib/supabase/client.ts` - Client-side Supabase instance
- ✅ Create `/src/lib/supabase/server.ts` - Server-side Supabase instance for API routes
- ✅ Set up TypeScript types for database schema in `/src/types/database.ts`

### 1.3 Database Schema Design ✅

Document the required Supabase tables:

- `users` - User authentication (handled by Supabase Auth)
- `sessions` - Conversation sessions (id, user_id, rite_of_passage, created_at, status)
- `conversations` - Individual exchanges (id, session_id, speaker_role, transcript, audio_url, timestamp)
- `generated_content` - Images/videos (id, session_id, content_type, url, prompt, created_at)

## Phase 2: Voice Recording & Transcription

### 2.1 Audio Recording Component

- Create `/src/components/VoiceRecorder.tsx`
  - Use Web Audio API (MediaRecorder) for browser-based recording
  - Support start/stop/pause functionality
  - Display real-time audio visualization (waveform)
  - Handle microphone permissions

### 2.2 Real-time Transcription Integration

- Create `/src/app/api/transcribe/route.ts` - API route for OpenAI Whisper
  - Accept audio blob from client
  - Call OpenAI Whisper API for transcription
  - Return transcript with timestamps
- Implement chunked audio streaming for real-time feel

### 2.3 Speaker Diarization Logic

- Create `/src/lib/speakerIdentification.ts`
  - Use audio features (pitch, volume patterns) to distinguish speakers
  - Track turn-taking patterns (elderly tends to speak longer)
  - Fallback: use timing patterns (alternating speakers)
  - Label as "elderly" or "young_adult"

## Phase 3: Conversation Flow & AI Prompts

### 3.1 Update Coming of Age Page

- Transform `/src/app/coming-of-age/page.tsx` into conversation interface
  - Show starter prompts (3 pre-written questions)
  - Display conversation history in real-time
  - Show current speaker indicator
  - Add recording controls

### 3.2 AI Prompt Generation

- Create `/src/app/api/generate-prompt/route.ts`
  - Accept conversation history
  - Use OpenAI GPT to generate contextual follow-up questions
  - Extract themes/keywords from elderly responses
  - Return suggested prompts for young adult
- Create `/src/lib/promptTemplates.ts` - Store initial starter questions

### 3.3 Conversation Manager

- Create `/src/components/ConversationInterface.tsx`
  - Manage conversation state (recording, transcribing, prompting)
  - Display transcript in real-time
  - Show AI-generated follow-up suggestions
  - Allow manual continuation (speakers drive conversation)

## Phase 4: Image Integration (Singapore Archives)

### 4.1 Archive Search Integration

- Create `/src/app/api/search-archives/route.ts`
  - Integrate with Singapore National Archives API or web scraping
  - Extract time periods, locations, events from elderly responses
  - Return relevant historical images
- Create `/src/lib/archiveService.ts` - Archive search logic

### 4.2 AI Image Generation (Placeholder)

- Create `/src/app/api/generate-image/route.ts`
  - Structure for future DALL-E or other image generation
  - Accept descriptive prompts from conversation
  - Store generated images in Vercel Blob or Supabase Storage

### 4.3 Image Display Component

- Create `/src/components/ImageGallery.tsx`
  - Show images alongside conversation
  - Display nostalgic archival photos contextually
  - Smooth transitions and animations

## Phase 5: Video Generation & Storage

### 5.1 Session Summary & Export

- Create `/src/app/api/sessions/[id]/summary/route.ts`
  - Compile conversation transcript
  - Collect all images (archival + AI-generated)
  - Generate summary using GPT

### 5.2 Slideshow Video Generator

- Create `/src/lib/videoGenerator.ts`
  - Use client-side library (e.g., `remotion` or canvas API)
  - Create slideshow: images + audio overlay
  - Add transitions, captions with key quotes
  - Export as MP4

### 5.3 Storage Integration

- Set up Supabase Storage buckets:
  - `audio-recordings` - Raw audio files
  - `generated-videos` - Final video outputs
  - `archive-images` - Cached archival images
- Create upload utilities in `/src/lib/storage.ts`

## Phase 6: Authentication & Session Management

### 6.1 Auth Setup

- Create `/src/app/auth/login/page.tsx` - Login page
- Create `/src/app/auth/signup/page.tsx` - Signup page
- Add Supabase Auth middleware in `/src/middleware.ts`
- Protect conversation routes

### 6.2 Session Dashboard

- Create `/src/app/dashboard/page.tsx`
  - List user's past sessions
  - Show session metadata (date, rite of passage, duration)
  - Allow replay/review of conversations
- Create `/src/app/dashboard/sessions/[id]/page.tsx` - Individual session view

## Phase 7: Apply to Other Rites of Passage

### 7.1 Generalize Conversation System

- Extract shared logic into `/src/components/RiteOfPassageConversation.tsx`
- Update remaining pages:
  - `/src/app/birth-childhood/page.tsx`
  - `/src/app/marriage/page.tsx`
  - `/src/app/death/page.tsx`
- Create rite-specific starter prompts in `/src/lib/promptTemplates.ts`

## Technical Considerations

- **Audio Format**: Use WebM/Opus for browser recording, convert to WAV for Whisper API
- **Real-time Updates**: Use Supabase Realtime for live transcript updates across devices
- **Rate Limiting**: Implement request throttling for OpenAI API calls
- **Mobile Optimization**: Ensure audio recording works on iOS Safari (requires user gesture)
- **Error Handling**: Graceful fallbacks for transcription/API failures

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── transcribe/route.ts
│   │   ├── generate-prompt/route.ts
│   │   ├── search-archives/route.ts
│   │   ├── generate-image/route.ts
│   │   └── sessions/[id]/summary/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── sessions/[id]/page.tsx
│   └── [rites-of-passage]/page.tsx (updated)
├── components/
│   ├── VoiceRecorder.tsx
│   ├── ConversationInterface.tsx
│   ├── ImageGallery.tsx
│   └── RiteOfPassageConversation.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── speakerIdentification.ts
│   ├── promptTemplates.ts
│   ├── archiveService.ts
│   ├── videoGenerator.ts
│   └── storage.ts
└── types/
    └── database.ts
```
