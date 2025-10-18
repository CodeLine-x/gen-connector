# Video Generation with Audio Feature

## 🎯 Overview

This feature enhances the video generation system to intelligently handle audio. When a song is found during the conversation, the final video will use that song as the background audio with a slideshow of generated images.

---

## 🎵 How It Works

### **Two Video Modes:**

#### **1. Slideshow Mode (with Audio)** 🎶

- **Triggered when:** At least one song is found during the conversation
- **Video content:** Slideshow of all generated images
- **Audio:** The first found song (Spotify or YouTube embed)
- **Duration:** 10 seconds (images cycle automatically)
- **User experience:** Images fade in/out with music playing

#### **2. AI Video Mode (no Audio)** 🎬

- **Triggered when:** No songs are found
- **Video content:** AI-generated video from Fal.ai
- **Audio:** None (silent video)
- **Duration:** 10 seconds
- **User experience:** Traditional AI-generated video montage

---

## 🔄 Flow Diagram

```
User Conversation (5 minutes max)
  ↓
For each 30-second segment:
  ├─ Search for songs (Exa.ai)
  │   ├─ If song found → Store song + caption
  │   └─ If not found → Generate image (Fal.ai)
  ↓
Session Complete (5 min or early wrap-up)
  ↓
Check: Any songs found?
  ├─ YES → Slideshow Mode
  │   ├─ Collect all generated images
  │   ├─ Use first found song
  │   ├─ Create slideshow with audio
  │   └─ Display on Video Screen
  │
  └─ NO → AI Video Mode
      ├─ Use Fal.ai to generate video
      ├─ No audio
      └─ Display on Video Screen
```

---

## 📁 Files Changed

### **1. Backend API Routes**

#### `src/app/api/fal/generate-video/route.ts`

- **Changes:** Added `songUrl` parameter check
- **Logic:** If `songUrl` is provided, return `useSlideshowMode: true` instead of generating AI video
- **Why:** Avoids unnecessary Fal.ai API calls when we have audio

```typescript
// New logic
if (songUrl) {
  console.log("🎵 Song detected - will create slideshow montage with audio");
  return NextResponse.json({
    success: true,
    useSlideshowMode: true,
    songUrl,
    message: "Use client-side slideshow with found song",
  });
}
```

#### `src/app/api/generate-video-with-audio/route.ts` (NEW)

- **Purpose:** Metadata storage for future video rendering
- **Stores:** Image URLs, audio URL, duration, aspect ratio
- **Note:** Currently for reference; actual rendering is client-side

#### `src/app/api/search-song/route.ts`

- **Fix:** Removed duplicate `found: true` property

---

### **2. Frontend Components**

#### `src/components/ConversationFlow.tsx`

- **Added:** Logic to find songs from `mediaItems`
- **Added:** Pass `songUrl` to video generation API
- **Added:** Handle `useSlideshowMode` response
- **Added:** Pass `mediaItems` and `useSlideshowMode` to `VideoScreen`
- **Database:** Mark session with `has_audio: true` when song is used

```typescript
// Find songs from collected media items
const foundSongs = mediaItems.filter(
  (item) => item.type === "audio" && item.audioUrl
);
const selectedSongUrl =
  foundSongs.length > 0 ? foundSongs[0].audioUrl : undefined;

if (selectedSongUrl) {
  console.log(`🎵 Using song from segment for video: ${foundSongs[0].caption}`);
}
```

#### `src/components/conversation-screens/VideoScreen.tsx`

- **Added:** `mediaItems` and `useSlideshowMode` props
- **Added:** Slideshow logic with automatic image cycling
- **Added:** YouTube/Spotify embed extraction
- **Added:** Audio player display below slideshow
- **UI:** Images fade in/out with smooth transitions
- **UI:** Audio player with song caption

```typescript
// Slideshow cycling logic
useEffect(() => {
  if (useSlideshowMode && images.length > 0) {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 10000 / images.length); // Distribute 10 seconds
    return () => clearInterval(interval);
  }
}, [useSlideshowMode, images.length]);
```

---

## 🎨 User Experience

### **Slideshow Mode (with Audio)**

```
┌────────────────────────────────────┐
│     AH MA'S CHILDHOOD              │
├────────────────────────────────────┤
│                                    │
│   [Image 1 fades in/out]          │
│   [Image 2 fades in/out]          │
│   [Image 3 fades in/out]          │
│   (Cycles through all images)     │
│                                    │
├────────────────────────────────────┤
│   🎵 Audio Player                  │
│   [Spotify/YouTube Embed]          │
│   "甜蜜蜜 by Teresa Teng"           │
├────────────────────────────────────┤
│   [Share Button]                   │
│   [Save to device Button]          │
│   [Start again Button]             │
└────────────────────────────────────┘
```

### **AI Video Mode (no Audio)**

```
┌────────────────────────────────────┐
│     AH MA'S CHILDHOOD              │
├────────────────────────────────────┤
│                                    │
│   [AI-Generated Video Player]     │
│   (10-second silent video)        │
│   (Play/Pause controls)           │
│                                    │
│                                    │
├────────────────────────────────────┤
│   [Share Button]                   │
│   [Save to device Button]          │
│   [Start again Button]             │
└────────────────────────────────────┘
```

---

## 🎯 Benefits

### **1. Audio Enforcement** ✅

- **No silent videos when music is available**
- If a song was found at any point, it's guaranteed to be used
- Better emotional connection for users

### **2. Cost Optimization** 💰

- **Avoids Fal.ai API calls when unnecessary**
- Slideshow rendering is free (client-side)
- Only use AI video generation when truly needed

### **3. Better UX** 🎨

- **Music enhances emotional impact**
- Spotify/YouTube embeds are familiar to users
- Smooth image transitions with audio sync

### **4. Verified Playability** 🔒

- All songs are **pre-validated** before use
- YouTube videos checked via oEmbed API
- Spotify tracks checked for accessibility

---

## 🎵 Song Selection Logic

```typescript
// Priority: Use first found song
const foundSongs = mediaItems.filter(
  (item) => item.type === "audio" && item.audioUrl
);

// Takes the FIRST song found (chronologically)
const selectedSongUrl =
  foundSongs.length > 0 ? foundSongs[0].audioUrl : undefined;
```

**Why first song?**

- Most relevant to the conversation
- Likely mentioned early in the dialogue
- Ensures consistency (not random)

---

## 🔮 Future Enhancements

### **1. Multiple Songs**

- Use different songs for different image segments
- Create multi-track montage

### **2. Server-Side Rendering**

- Generate actual MP4 file with audio mixed in
- Use FFmpeg for professional video encoding

### **3. Advanced Editing**

- User can choose which song to use
- Adjust image display duration
- Add transitions and effects

### **4. Audio Extraction**

- Download full audio from Spotify/YouTube
- Trim to exact 10-second clips
- Mix with narration or voice-over

---

## 🧪 Testing Checklist

- [ ] **Slideshow Mode**

  - [ ] Images cycle smoothly
  - [ ] Audio player loads correctly
  - [ ] Song caption displays
  - [ ] Transitions are smooth (1s fade)
  - [ ] Works with Spotify URLs
  - [ ] Works with YouTube URLs

- [ ] **AI Video Mode**

  - [ ] Triggers when no songs found
  - [ ] Video generates successfully
  - [ ] Video is silent (no audio)
  - [ ] Controls work (play/pause)

- [ ] **Edge Cases**
  - [ ] Only 1 image + 1 song
  - [ ] Multiple images + 1 song
  - [ ] Multiple songs (should use first)
  - [ ] No images, only songs
  - [ ] No songs, only images

---

## 📊 Database Schema Update

The `sessions` table should have a `has_audio` field to track sessions with audio:

```sql
ALTER TABLE sessions
ADD COLUMN has_audio BOOLEAN DEFAULT FALSE;
```

**Usage:**

- Analytics: Track how many sessions have music
- Filtering: Show "sessions with audio" in user history
- Recommendations: Suggest music-related prompts

---

## 🎬 Example Scenarios

### **Scenario 1: Song Found Early**

```
Segment 1: "Ah Ma loved Teresa Teng" → 🎵 Song found
Segment 2-10: Generate images
  ↓
Result: Slideshow of 9 images + Teresa Teng audio
```

### **Scenario 2: Song Found Late**

```
Segment 1-8: Generate images
Segment 9: "She listened to 甜蜜蜜" → 🎵 Song found
Segment 10: Generate image
  ↓
Result: Slideshow of 9 images + 甜蜜蜜 audio
```

### **Scenario 3: No Song Found**

```
Segment 1-10: All generate images (no music mentioned)
  ↓
Result: AI-generated video (Fal.ai) with no audio
```

### **Scenario 4: Multiple Songs**

```
Segment 2: "Teresa Teng" → 🎵 Song A found
Segment 7: "Elvis Presley" → 🎵 Song B found
  ↓
Result: Use Song A (first found) for slideshow
```

---

## 🎯 Summary

This feature creates a **smarter, more engaging video experience** by:

1. ✅ **Enforcing audio** when music is available
2. ✅ **Validating** all songs before use
3. ✅ **Optimizing costs** by using client-side slideshow
4. ✅ **Enhancing UX** with smooth transitions and familiar embeds
5. ✅ **Maintaining quality** with verified, playable music sources

**Result:** Users get a beautiful memory montage with music that actually plays! 🎉
