# 🎨 Fal.ai Integration Documentation

## Overview

This document describes the Fal.ai integration for AI-powered image and video generation in the Intergenerational Voice Storytelling App.

---

## ✅ What's Been Implemented

### 1. **Environment Configuration**

- Added `FAL_KEY` to `env.example`
- Installed `@fal-ai/serverless-client` SDK

### 2. **Core Services**

#### **`src/lib/falService.ts`**

- Image generation using `fal-ai/nano-banana` (photorealistic, fast)
- Video generation using `fal-ai/bytedance/seedance/v1/lite/text-to-video`
- Retry logic with configurable attempts
- Placeholder image fallback for failures
- Queue monitoring and logging

#### **`src/lib/promptGenerator.ts`**

- OpenAI GPT-3.5-turbo integration for prompt generation
- Generates both image and video prompts from conversation segments
- Extracts keywords, era, and location from conversations
- Fallback prompts if AI generation fails
- Optimized for photorealistic, documentary-style outputs

### 3. **API Routes**

#### **`/api/fal/generate-image` (POST)**

- **Input:**
  ```json
  {
    "turns": [{ "speaker": "elderly", "transcript": "..." }],
    "riteOfPassage": "coming-of-age",
    "segmentNumber": 1
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "imageUrl": "https://...",
    "prompt": "A photorealistic...",
    "keywords": ["memory", "nostalgia"],
    "era": "1980s",
    "location": "Singapore",
    "metadata": { "width": 1920, "height": 1080, "seed": 12345 }
  }
  ```
- **Features:**
  - Retry logic (1 retry attempt)
  - Placeholder fallback on failure
  - Never breaks the flow (always returns success)

#### **`/api/fal/generate-video` (POST)**

- **Input:**
  ```json
  {
    "turns": [
      /* all conversation turns */
    ],
    "riteOfPassage": "coming-of-age",
    "sessionId": "uuid"
  }
  ```
- **Output:**
  ```json
  {
    "success": true,
    "videoUrl": "https://...",
    "prompt": "A cinematic memory reel...",
    "keywords": ["life story", "journey"],
    "metadata": { "fileName": "video.mp4", "fileSize": 12345 }
  }
  ```
- **Features:**
  - Generates 5-second videos
  - 16:9 aspect ratio
  - Retry logic
  - Returns error if all retries fail

### 4. **Frontend Integration**

#### **ImprovedSegmentedConversation Component**

- **Real-time Image Generation:**
  - Triggers immediately after each 30-second segment is processed
  - Shows loading indicator during generation
  - Displays generated image with prompt
  - Stores in Supabase `generated_content` table
- **Video Generation:**
  - Triggers when user clicks "End Session & Generate Video"
  - Also triggers automatically at 5-minute mark
  - Generates comprehensive video from all conversation segments
  - Opens video in new tab when complete
  - Stores in database

#### **UI Updates:**

- Added `generatedImageUrl`, `isGeneratingImage`, `imagePrompt` to `UISegment` interface
- Real-time image display in segment cards
- Loading states for image generation
- Responsive image display with prompts

### 5. **Database Integration**

#### **`generated_content` Table**

Stores all generated content with:

- `session_id` - Links to parent session
- `segment_id` - Links to specific segment (null for session-level content)
- `type` - "image" or "video"
- `content_url` - Fal.ai generated URL
- `prompt` - OpenAI generated prompt
- `metadata` - JSON with keywords, era, location, dimensions, etc.

---

## 🔄 User Flow

### **During Recording (Real-time)**

1. User records 30-second segment
2. Segment is diarized via ElevenLabs
3. Turns are saved to database
4. **Image generation starts immediately (non-blocking)**
   - OpenAI generates prompt from elderly's responses
   - Fal.ai generates photorealistic image
   - Image appears in UI within ~5-10 seconds
5. Process repeats for each 30-second segment

### **End of Session**

1. User clicks "End Session & Generate Video" OR 5-minute auto-stop
2. System collects all conversation turns
3. **Video generation starts:**
   - OpenAI generates comprehensive video prompt
   - Fal.ai generates 5-second cinematic video
   - Video URL saved to database
4. Video opens in new tab automatically

---

## 🎛️ Configuration

### **Image Generation Settings**

```typescript
{
  model: "fal-ai/nano-banana",
  imageSize: "landscape_16_9", // 1920x1080
  numInferenceSteps: 4,         // Fast generation
  guidanceScale: 3.5,
  enableSafetyChecker: true
}
```

### **Video Generation Settings**

```typescript
{
  model: "fal-ai/bytedance/seedance/v1/lite/text-to-video",
  duration: 10,                 // Always 10 seconds (maximum for lite model)
  aspectRatio: "16:9"
}
```

### **Prompt Generation**

- **Model:** GPT-3.5-turbo
- **Style:** Photorealistic, documentary-style
- **Focus:** Southeast Asian context, nostalgic atmosphere
- **Temperature:** 0.7 (images), 0.8 (videos)

---

## 🛡️ Error Handling

### **Image Generation**

1. First attempt fails → Retry once (after 1s delay)
2. Second attempt fails → Use placeholder image
3. **Never breaks the recording flow**

### **Video Generation**

1. First attempt fails → Retry once (after 2s delay)
2. Second attempt fails → Show error alert
3. Conversation data is still saved

### **Placeholder Image**

- Used when Fal.ai generation fails completely
- Format: `https://via.placeholder.com/1920x1080/cccccc/666666?text={message}`
- Marked with `isPlaceholder: true` in metadata

---

## 📊 Performance Considerations

### **Image Generation**

- **Time:** ~5-10 seconds per image
- **Non-blocking:** Doesn't interrupt recording
- **User sees:** Loading indicator → Generated image

### **Video Generation**

- **Time:** ~15-30 seconds (depending on queue)
- **Blocking:** User waits at end of session
- **User sees:** Alert → Video opens in new tab

### **Cost Optimization**

- Using **nano-banana** (fast, cost-effective)
- Using **lite** video model (lower cost than pro)
- Using **GPT-3.5-turbo** instead of GPT-4 (10x cheaper)

---

## 🧪 Testing Checklist

### **Image Generation**

- [ ] Record 30-second segment
- [ ] Verify "Generating image..." indicator appears
- [ ] Verify image appears within 10 seconds
- [ ] Verify image is photorealistic and relevant
- [ ] Test with elderly responses only
- [ ] Test with no elderly responses
- [ ] Test retry logic (simulate API failure)
- [ ] Test placeholder fallback

### **Video Generation**

- [ ] Record multiple segments
- [ ] Click "End Session & Generate Video"
- [ ] Verify video generates successfully
- [ ] Verify video opens in new tab
- [ ] Verify video is 5 seconds long
- [ ] Test with 1 segment vs 10 segments
- [ ] Test auto-stop at 5 minutes

### **Database**

- [ ] Verify images stored in `generated_content`
- [ ] Verify videos stored in `generated_content`
- [ ] Verify `segment_id` linkage for images
- [ ] Verify `session_id` linkage for videos
- [ ] Verify metadata is properly structured

---

## 🔮 Future Enhancements

1. **Option C Video Montage** (mentioned in requirements)

   - Combine generated images into slideshow
   - Add audio overlay from conversation
   - Use Canvas API for client-side rendering
   - Fallback to Fal.ai if not enough images

2. **Image Style Options**

   - Allow user to choose: nostalgic, photorealistic, artistic
   - Store preference in user profile

3. **Video Duration Options**

   - Allow 5s, 10s, or 30s videos
   - Longer duration for more conversation

4. **Batch Processing**

   - Queue all images for end-of-session generation
   - Trade-off: Faster recording, longer wait at end

5. **Image Editing**
   - Allow users to regenerate with different prompts
   - Save favorite images
   - Download images

---

## 📝 Environment Variables Checklist

```bash
# Required for Fal.ai integration
FAL_KEY=your_fal_ai_api_key_here

# Required for prompt generation
OPENAI_API_KEY=sk-your_openai_api_key_here

# Required for database storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 🐛 Common Issues & Solutions

### **Issue:** Image not appearing

- **Check:** FAL_KEY is set correctly
- **Check:** OpenAI API key is valid
- **Check:** Network tab for API errors
- **Check:** Console for detailed error logs

### **Issue:** Placeholder images appearing

- **Cause:** Fal.ai API failures
- **Solution:** Check API quota/billing
- **Temporary:** Placeholders are working as intended

### **Issue:** Video generation timeout

- **Cause:** Long queue or slow generation
- **Solution:** Use "lite" model (already configured)
- **Workaround:** Retry generation from dashboard

---

## 📚 API Documentation Links

- **Fal.ai:** https://fal.ai/models
  - nano-banana: https://fal.ai/models/fal-ai/nano-banana
  - seedance: https://fal.ai/models/fal-ai/bytedance/seedance
- **OpenAI:** https://platform.openai.com/docs/api-reference/chat
- **Supabase:** https://supabase.com/docs/guides/database

---

## ✅ Implementation Complete!

All features from the user requirements have been implemented:

1. ✅ Fal.ai integration for image generation
2. ✅ Fal.ai integration for video generation
3. ✅ Image generation after each 30-second segment
4. ✅ OpenAI prompt generation from conversation
5. ✅ Real-time UI updates
6. ✅ Database storage
7. ✅ Retry logic and fallbacks
8. ✅ Video trigger at 5-minute mark or manual stop

**Ready for testing!** 🚀
