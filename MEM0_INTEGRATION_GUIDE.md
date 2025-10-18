# Mem0 Integration Guide

## 🧠 **What is Mem0?**

Mem0 is a memory management platform that enables AI applications to store, retrieve, and manage contextual information across conversations. It's perfect for creating persistent, context-aware experiences.

**Key Benefits:**

- ✅ **Persistent Memory** - Remember user preferences across sessions
- ✅ **Semantic Search** - Find relevant memories using natural language
- ✅ **Context Awareness** - Build on previous conversations
- ✅ **Multi-Entity Support** - Manage memories for different users/agents

---

## 🚀 **Getting Started**

### **1. Sign Up for Mem0**

1. Visit [Mem0 Dashboard](https://app.mem0.ai)
2. Create an account and get your API key
3. Optionally create an organization and project

### **2. Add Environment Variables**

```bash
# Add to your .env.local file
MEM0_API_KEY=your_mem0_api_key_here
MEM0_ORG_ID=your_organization_id_here  # Optional
MEM0_PROJECT_ID=your_project_id_here    # Optional
```

### **3. Use the Mem0 Service**

```typescript
import { createMem0Service } from "@/lib/mem0Service";

const mem0 = createMem0Service();

// Add a memory
await mem0.addMemory({
  text: "User prefers dark mode and loves jazz music",
  metadata: { userId: "user123", category: "preferences" },
});

// Search memories
const results = await mem0.searchMemories({
  query: "user preferences",
  metadata: { userId: "user123" },
});
```

---

## 🎯 **Integration Ideas for Your App**

### **1. User Preference Memory**

Store user preferences discovered during conversations:

```typescript
// When user mentions preferences
await mem0.addMemory({
  text: "Ah Ma mentioned she loves Teresa Teng's music from the 1970s",
  metadata: {
    userId: sessionId,
    category: "music_preferences",
    era: "1970s",
    artist: "Teresa Teng",
  },
});
```

### **2. Family History Memory**

Remember family stories and relationships:

```typescript
// When user shares family stories
await mem0.addMemory({
  text: "Ah Ma talked about her childhood in Singapore during the 1950s",
  metadata: {
    userId: sessionId,
    category: "family_history",
    location: "Singapore",
    era: "1950s",
    relationship: "grandmother",
  },
});
```

### **3. Context-Aware Prompts**

Use memories to generate better conversation prompts:

```typescript
// Before starting a new conversation
const userMemories = await mem0.searchMemories({
  query: "previous conversations with this user",
  metadata: { userId: sessionId },
});

// Use memories to personalize prompts
const personalizedPrompt = generatePromptFromMemories(userMemories);
```

---

## 🔧 **API Routes Created**

### **Add Memory**

```typescript
POST /api/mem0/add-memory
{
  "text": "Memory content",
  "metadata": { "userId": "123", "category": "preferences" },
  "entityId": "user123"
}
```

### **Search Memories**

```typescript
POST /api/mem0/search-memories
{
  "query": "user preferences",
  "entityId": "user123",
  "limit": 10
}
```

---

## 🎨 **Integration Examples**

### **1. Enhanced Conversation Flow**

```typescript
// In ConversationFlow.tsx
const loadUserMemories = async (sessionId: string) => {
  const response = await fetch("/api/mem0/search-memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "previous conversations",
      entityId: sessionId,
    }),
  });

  const { results } = await response.json();
  return results.memories;
};

// Use memories to personalize the experience
const memories = await loadUserMemories(sessionId);
const personalizedPrompts = generatePromptsFromMemories(memories);
```

### **2. Smart Question Generation**

```typescript
// Generate questions based on previous memories
const generateSmartQuestions = async (sessionId: string, category: string) => {
  const memories = await mem0.searchMemories({
    query: `previous ${category} conversations`,
    metadata: { userId: sessionId },
  });

  // Avoid repeating questions
  const usedTopics = memories.memories.map((m) => m.metadata?.topic);

  // Generate new questions that build on previous knowledge
  return generateQuestionsAvoidingTopics(usedTopics);
};
```

### **3. Memory-Based Video Generation**

```typescript
// Use memories to enhance video prompts
const generateVideoWithMemories = async (sessionId: string, turns: any[]) => {
  const memories = await mem0.searchMemories({
    query: "family history and preferences",
    metadata: { userId: sessionId },
  });

  // Combine conversation with memories for richer video
  const enhancedPrompt = createVideoPromptWithMemories(
    turns,
    memories.memories
  );

  return generateVideo(enhancedPrompt);
};
```

---

## 🧠 **Memory Categories**

### **User Preferences**

- Music preferences (artists, genres, eras)
- Visual preferences (colors, styles)
- Communication style
- Language preferences

### **Family History**

- Childhood memories
- Family relationships
- Important life events
- Cultural background

### **Conversation Context**

- Previous topics discussed
- Questions already asked
- Emotional responses
- Conversation patterns

### **Technical Context**

- Device preferences
- Accessibility needs
- Technical limitations
- Usage patterns

---

## 🔄 **Memory Lifecycle**

### **1. Capture**

- During conversation segments
- When user expresses preferences
- When sharing personal stories
- When showing emotional responses

### **2. Store**

- Immediately after capture
- With relevant metadata
- Linked to user/session
- Categorized appropriately

### **3. Retrieve**

- Before starting new conversations
- When generating prompts
- When creating personalized content
- When building context

### **4. Update**

- When new information contradicts old
- When preferences change
- When relationships evolve
- When context deepens

---

## 📊 **Example Memory Structure**

```typescript
{
  "id": "mem_123456",
  "text": "Ah Ma loves Teresa Teng's music, especially '甜蜜蜜' from 1977",
  "metadata": {
    "userId": "session_abc123",
    "category": "music_preferences",
    "artist": "Teresa Teng",
    "song": "甜蜜蜜",
    "year": "1977",
    "language": "Chinese",
    "emotional_tone": "nostalgic",
    "confidence": 0.9
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 🎯 **Next Steps**

### **1. Basic Integration**

- [ ] Add Mem0 API key to environment
- [ ] Test memory storage and retrieval
- [ ] Integrate with conversation flow

### **2. Enhanced Features**

- [ ] Memory-based prompt generation
- [ ] Personalized question selection
- [ ] Context-aware video generation
- [ ] Cross-session memory continuity

### **3. Advanced Features**

- [ ] Memory compression and summarization
- [ ] Relationship mapping between memories
- [ ] Memory-based recommendations
- [ ] Privacy and data management

---

## 🔗 **Resources**

- [Mem0 API Documentation](https://docs.mem0.ai/api-reference)
- [Mem0 Dashboard](https://app.mem0.ai)
- [Memory Management Best Practices](https://docs.mem0.ai/guides/memory-management)

---

## 💡 **Pro Tips**

1. **Start Simple** - Begin with basic memory storage and retrieval
2. **Categorize Well** - Use consistent metadata categories
3. **Search Smart** - Use semantic queries for better results
4. **Respect Privacy** - Be transparent about memory usage
5. **Iterate Often** - Continuously improve memory quality

**Mem0 will transform your app from a simple conversation tool into an intelligent, context-aware memory companion!** 🧠✨
