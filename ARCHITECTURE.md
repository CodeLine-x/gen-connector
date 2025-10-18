# Gen-Connector Architecture V2

## Overview

Gen-Connector captures intergenerational conversations and transforms them into multimedia montages using AI-driven analysis.

---

## Data Model

### Hierarchy

```
Session (Chat)
  └─ Segments (30-second chunks, max 10)
       └─ Turns (Individual speaker exchanges)
            └─ Actions (AI-triggered multimedia)
```

### Database Tables

#### 1. **sessions**

- Represents a complete conversation session
- Max duration: 5 minutes (300 seconds)
- Max segments: 10 (30 seconds each)
- Status: `active`, `completed`, `cancelled`

#### 2. **segments**

- 30-second audio chunks
- Auto-created every 30 seconds during recording
- Contains: audio URL, transcription status, AI summary
- Links to: session, turns, actions

#### 3. **turns**

- Individual speaker exchanges within a segment
- Speaker: `elderly` or `young_adult`
- Contains: transcript, confidence, timing
- Links to: segment, session

#### 4. **actions**

- AI-triggered multimedia actions per segment
- Types: `song_search`, `image_search`, `image_generation`
- Priority: song (1) > image_search (2) > image_generation (3)
- Constraint: Avoid consecutive duplicate actions

---

## Recording Flow

### 1. **User Initiates Recording**

```
User clicks "Start" → SegmentManager.startRecording()
```

### 2. **Every 30 Seconds (Auto-Snapshot)**

```
Timer → Create new segment
      → Upload audio to Vercel Blob
      → Send to ElevenLabs for diarization
      → Extract turns (elderly vs young_adult)
      → Save turns to database
      → Extract elderly responses
      → Call AI to analyze and determine action
      → Create action record
      → Continue recording...
```

### 3. **User Stops Recording (Anytime < 5 min)**

```
User clicks "Stop" → Finalize current segment (if < 30s)
                   → Update session status to "completed"
                   → Trigger video generation
```

---

## AI Action Logic

### Priority System

1. **song_search** (Priority 1)
   - Triggers when elderly mentions: songs, artists, music, singing
   - Extracts: `{ artist, title, year, lyrics, genre }`
2. **image_search** (Priority 2)
   - Triggers when elderly mentions: locations, landmarks, historical events
   - Extracts: `{ keywords, location, time_period, people }`
3. **image_generation** (Priority 3)
   - Triggers when elderly mentions: personal scenes, abstract memories
   - Extracts: `{ description, keywords }`

### Constraint Rules

- **One action per segment** (no multiple actions)
- **Avoid consecutive duplicates** (e.g., don't do `image_search` twice in a row)
- **Priority hierarchy enforced** (song > image_search > image_generation)

---

## Code Structure

### Core Services

#### **SegmentManager** (`src/lib/segmentManager.ts`)

- Manages segment creation and lifecycle
- Handles 30-second auto-snapshot logic
- Coordinates turns and actions
- Finalizes session

**Key Methods:**

```typescript
startRecording(); // Initialize recording
createSegment(blob, duration); // Create new 30s segment
saveTurns(segmentId, turns); // Save conversation turns
extractElderlyResponses(); // Filter elderly speaker data
determineAndCreateAction(); // AI analysis & action creation
finalizeSession(); // End session & prepare for video
```

#### **Speaker Diarization** (`src/lib/speakerDiarization.ts`)

- Uses ElevenLabs API for speaker identification
- Processes word tokens into readable segments
- Identifies elderly vs young_adult based on heuristics

**Key Methods:**

```typescript
analyzeSpeakers(audioBlob); // Call ElevenLabs API
processDiarizationResult(result); // Parse words into segments
identifySpeakerRoles(); // Map speaker_0/1 to elderly/young_adult
convertToConversationTurns(); // Format for database
```

### API Routes

#### **/api/analyze-segment** (POST)

```typescript
Input: { transcript: string, lastActionType: string }
Output: {
  actionType: "song_search" | "image_search" | "image_generation" | "none",
  reasoning: string,
  keywords: SongKeywords | ImageKeywords
}
```

- Uses OpenAI GPT-3.5-turbo
- Analyzes elderly responses
- Determines multimedia action with priority logic

#### **/api/diarize-speakers** (POST)

```typescript
Input: FormData { audio: Blob }
Output: {
  turns: Array<{ speaker, transcript, timestamp, confidence }>,
  speakers: string[]
}
```

- Sends audio to ElevenLabs
- Returns diarized conversation turns

---

## UI Components

### **ImprovedSegmentedConversation** (Main Component)

Located: `src/components/ImprovedSegmentedConversation.tsx`

**Features:**

- Start/Stop recording toggle
- Auto-snapshot every 30 seconds
- Real-time segment display
- Background processing for seamless UX
- Session statistics (segments, turns, speakers)
- "End Session & Generate Video" button

**State Management:**

```typescript
segments: ConversationSegment[]  // All recorded segments
isRecording: boolean             // Recording state
currentPrompts: string[]         // AI-generated questions
showImageGallery: boolean        // Display multimedia
```

---

## Database Queries

### Get Segment with Turns

```sql
SELECT
  s.segment_number,
  s.duration_seconds,
  t.speaker,
  t.transcript
FROM segments s
LEFT JOIN turns t ON t.segment_id = s.id
WHERE s.session_id = '<session_id>'
ORDER BY s.segment_number, t.turn_number;
```

### Get Elderly Responses for AI Analysis

```sql
SELECT transcript, confidence
FROM turns
WHERE segment_id = '<segment_id>' AND speaker = 'elderly'
ORDER BY turn_number;
```

### Get Action History

```sql
SELECT
  seg.segment_number,
  a.action_type,
  a.keywords,
  a.result_url
FROM actions a
JOIN segments seg ON seg.id = a.segment_id
WHERE a.session_id = '<session_id>'
ORDER BY seg.segment_number;
```

---

## Next Steps

### Immediate (You're Here)

- ✅ Database schema created (`database-schema-v2.sql`)
- ✅ TypeScript types defined (`src/types/database-v2.ts`)
- ✅ SegmentManager service created
- ✅ AI analysis API route created
- ⏳ **TODO:** Integrate SegmentManager into UI component
- ⏳ **TODO:** Implement 30-second auto-snapshot timer
- ⏳ **TODO:** Test end-to-end flow

### Phase 2: Multimedia Actions

- Implement song search (Spotify/YouTube API)
- Implement image search (Singapore Archives API)
- Implement image generation (DALL-E API)
- Store action results in database

### Phase 3: Video Generation

- Collect all segments, turns, and actions
- Generate video montage with:
  - Audio overlays (elderly responses)
  - Images/generated content
  - Song clips
  - Transitions and effects

### Phase 4: Mem0 Integration

- Store conversation context in Mem0
- Enhanced memory retrieval across sessions
- Personalized prompt generation

---

## Environment Variables

Required in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# ElevenLabs (Speaker Diarization)
ELEVENLABS_API_KEY=

# OpenAI (AI Analysis & Prompts)
OPENAI_API_KEY=

# Vercel Blob (Audio/Video Storage)
BLOB_READ_WRITE_TOKEN=

# Site URL (for OAuth & API routes)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Testing Checklist

### Database Setup

- [ ] Run `database-schema-v2.sql` in Supabase SQL Editor
- [ ] Verify all tables created
- [ ] Test RLS policies with authenticated user

### Recording Flow

- [ ] Start recording → Verify session created
- [ ] Wait 30 seconds → Verify segment auto-created
- [ ] Speak as two people → Verify diarization
- [ ] Check turns saved → Verify elderly responses extracted
- [ ] Check AI analysis → Verify action created
- [ ] Stop recording → Verify session finalized

### Action Logic

- [ ] Segment 1: Mention song → Verify `song_search` action
- [ ] Segment 2: Mention location → Verify `image_search` action
- [ ] Segment 3: Mention song again → Verify switches to different action (not `song_search`)

---

## Troubleshooting

### Issue: No segments created after 30 seconds

- Check if timer is running in UI component
- Verify `SegmentManager.createSegment()` is called
- Check Supabase database for errors

### Issue: All speakers identified as single speaker

- ElevenLabs diarization requires distinct voices
- Test with clearly different male/female voices
- Check audio quality (clear, no background noise)

### Issue: Wrong action type chosen

- Review OpenAI prompt in `/api/analyze-segment`
- Check if `lastActionType` is being passed correctly
- Adjust priority logic if needed

---

## Resources

- [ElevenLabs Speech-to-Text API](https://elevenlabs.io/docs/models#scribe-v1)
- [OpenAI GPT-3.5-turbo](https://platform.openai.com/docs/models/gpt-3-5-turbo)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
