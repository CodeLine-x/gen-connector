# AI Handler Architecture - Hybrid Approach

## Overview

The Gen-Connector AI system uses a **hybrid approach** combining real-time per-segment analysis with end-of-session batch optimization.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  RECORDING PHASE (Real-time)                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Segment 1 (0-30s)                                          │
│    ↓                                                         │
│  SegmentAIHandler.quickProcess()                            │
│    ↓                                                         │
│  /api/analyze-segment (mode: "quick")                       │
│    ↓                                                         │
│  ✅ Quick Result: "song_search" (preliminary)               │
│    ↓                                                         │
│  💡 Show in UI immediately                                  │
│                                                              │
│  ... repeat for Segments 2-10 ...                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  END-OF-SESSION PHASE (Batch Optimization)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User clicks "Generate Video"                               │
│    ↓                                                         │
│  SessionAIOrchestrator.finalProcess()                       │
│    ↓                                                         │
│  1. Load ALL segments + turns from database                 │
│  2. Build GlobalContext (themes, timeline, etc.)            │
│  3. /api/orchestrate-session → GPT analyzes EVERYTHING      │
│  4. OptimizedActionPlan:                                    │
│     - 3 best songs (consolidated)                           │
│     - 5 archive searches (unique locations)                 │
│     - 5 image generations (filling gaps)                    │
│  5. Execute all actions in parallel                         │
│  6. Generate video with all artifacts                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. **SegmentAIHandler** (Real-time)

**Location:** `src/lib/aiHandlers/SegmentAIHandler.ts`

**Purpose:** Provide immediate feedback during recording

**Methods:**

- `quickProcess(segmentNumber, elderlyResponses, lastActionType)` - Fast analysis
- `extractElderlyResponses(turns)` - Filter elderly speaker
- `fallbackAnalysis(transcript)` - Keyword-based backup

**Characteristics:**

- ⚡ **Fast** (< 2 seconds)
- 💡 **Lightweight** - Uses simple prompts
- 🎯 **Preliminary** - Results flagged as `isPreliminary: true`
- 🔄 **Real-time UI feedback** - Shows user what's being detected

**Example Output:**

```typescript
{
  actionType: "song_search",
  confidence: 0.7,
  keywords: { artist: "Beatles", title: "Yesterday" },
  reasoning: "Mentioned specific song and artist",
  isPreliminary: true // ← Important flag
}
```

---

### 2. **SessionAIOrchestrator** (End-of-Session)

**Location:** `src/lib/aiHandlers/SessionAIOrchestrator.ts`

**Purpose:** Re-analyze entire conversation for optimal output

**Methods:**

- `finalProcess(sessionId)` - Main entry point
- `loadAllSegments(sessionId)` - Fetch all data
- `buildRichContext(segments)` - Extract themes, timeline
- `planOptimalActions(context)` - AI-powered planning
- `executeActionPlan(plan)` - Parallel execution
- `storeResults(sessionId, results)` - Save to DB

**Characteristics:**

- 🧠 **Smart** - Uses full conversation context
- 🎯 **Optimized** - Eliminates redundancy
- 💰 **Cost-effective** - Consolidates similar actions
- ⏱️ **Batch processing** - All actions in parallel

**Example Output:**

```typescript
{
  songs: [
    { priority: 1, keywords: { artist: "Beatles", title: "Yesterday" }, segmentNumbers: [2, 5, 7] }
  ],
  imageSearches: [
    { priority: 1, keywords: ["singapore", "chinatown", "1960s"], segmentNumbers: [1, 3] },
    { priority: 2, keywords: ["raffles place", "1970s"], segmentNumbers: [4, 6] }
  ],
  imageGenerations: [
    { priority: 1, prompt: "Family dinner...", style: "nostalgic...", segmentNumbers: [8] }
  ],
  totalCost: 0.45,
  estimatedTime: 40
}
```

---

## API Routes

### `/api/analyze-segment` (Real-time)

**Purpose:** Quick per-segment analysis

**Request:**

```json
{
  "transcript": "I remember singing Yesterday by the Beatles...",
  "lastActionType": "none",
  "mode": "quick"
}
```

**Response:**

```json
{
  "actionType": "song_search",
  "confidence": 0.8,
  "keywords": { "artist": "Beatles", "title": "Yesterday" },
  "reasoning": "Specific song mention"
}
```

---

### `/api/orchestrate-session` (End-of-Session)

**Purpose:** Global optimization with full context

**Request:**

```json
{
  "sessionId": "xxx-xxx-xxx",
  "context": {
    "totalSegments": 10,
    "totalTurns": 45,
    "elderlyTranscripts": ["...", "..."],
    "themes": ["music", "family", "wartime"]
  }
}
```

**Response:**

```json
{
  "actionPlan": {
    "songs": [...],
    "imageSearches": [...],
    "imageGenerations": [...]
  },
  "reasoning": "..."
}
```

---

## Benefits of Hybrid Approach

### ✅ **Real-time Benefits:**

1. **Instant feedback** - User sees analysis as they record
2. **Engagement** - Visual indicators keep user interested
3. **Error detection** - Can adjust if AI misinterprets early on
4. **Progressive disclosure** - Hints at what final video will contain

### ✅ **End-of-Session Benefits:**

1. **Better context** - AI sees the full story arc
2. **Deduplication** - "Beatles" mentioned 3 times → 1 song action
3. **Quality over quantity** - Picks the BEST 3-5 items, not all 10
4. **Cost optimization** - Only generate what's needed
5. **Coherent narrative** - Video flows naturally

### ✅ **Combined Power:**

- User gets **immediate feedback** during recording
- Final output is **optimized and polished**
- No wasted API calls or redundant content
- Best of both worlds! 🎉

---

## Usage Example

### During Recording:

```typescript
import { segmentAIHandler } from "@/lib/aiHandlers/SegmentAIHandler";

// After each 30-second segment
const elderlyTurns = turns.filter((t) => t.speaker === "elderly");
const quickResult = await segmentAIHandler.quickProcess(
  segmentNumber,
  elderlyTurns,
  lastActionType
);

// Show in UI immediately
console.log(`💡 Quick analysis: ${quickResult.actionType}`);
// UI updates: "🎵 Song detected! (preliminary)"
```

### After Recording:

```typescript
import { sessionAIOrchestrator } from "@/lib/aiHandlers/SessionAIOrchestrator";

// When user clicks "Generate Video"
const results = await sessionAIOrchestrator.finalProcess(sessionId);

// Results contain:
// - 3 curated songs
// - 5 relevant archive images
// - 5 AI-generated images
// - All optimized for coherent video

console.log(
  `✅ Generated ${
    results.songs.length +
    results.archiveImages.length +
    results.generatedImages.length
  } artifacts`
);
```

---

## Cost Estimation

### Real-time Phase (Per Segment):

- OpenAI GPT-3.5-turbo: $0.0005 per segment
- **Total for 10 segments:** ~$0.005

### End-of-Session Phase:

- OpenAI orchestration: $0.002 (one call)
- fal.ai FLUX Pro images (5×): $0.05 × 5 = $0.25
- Archive searches: Free
- Song searches: Free (Spotify/YouTube)
- **Total:** ~$0.25

### **Grand Total per Session:** ~$0.255 (¢25.5)

**Very affordable!** 💰

---

## Future Enhancements

### Phase 2:

- [ ] Implement song search (Spotify API)
- [ ] Implement video generation (Canvas-based montage)
- [ ] Add fal.ai integration for image generation

### Phase 3:

- [ ] Emotion detection in elderly responses
- [ ] Automatic highlight reel generation
- [ ] Multi-language support

### Phase 4:

- [ ] Long-term memory with Mem0
- [ ] Cross-session insights
- [ ] Family tree integration

---

## Testing Checklist

### Real-time Testing:

- [ ] Record 30 seconds mentioning a song
- [ ] Check UI shows "🎵 Song detected (preliminary)"
- [ ] Verify action saved with `isPreliminary: true`

### End-of-Session Testing:

- [ ] Complete full 5-minute recording
- [ ] Click "Generate Video"
- [ ] Verify orchestration API called
- [ ] Check optimized action plan in console
- [ ] Verify deduplication working (3 song mentions → 1 action)

---

## Summary

The **Hybrid AI Architecture** gives Gen-Connector the best of both worlds:

- 🚀 **Real-time engagement** during recording
- 🧠 **Smart optimization** for final output
- 💰 **Cost-effective** with parallel execution
- 🎯 **High-quality** results every time

**Ready for implementation!** 🎉
