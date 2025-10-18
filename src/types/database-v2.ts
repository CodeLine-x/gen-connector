// =====================================================
// TypeScript Types for Database Schema V2
// Matches: database-schema-v2.sql
// =====================================================

// =====================================================
// 1. SESSIONS
// =====================================================
export interface Session {
  id: string;
  user_id: string;
  rite_of_passage: "birth_childhood" | "coming_of_age" | "marriage" | "death";
  status: "active" | "completed" | "cancelled";
  total_duration_seconds: number;
  total_segments: number;
  summary: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface SessionInsert {
  id?: string;
  user_id: string;
  rite_of_passage: "birth_childhood" | "coming_of_age" | "marriage" | "death";
  status?: "active" | "completed" | "cancelled";
  total_duration_seconds?: number;
  total_segments?: number;
  summary?: string | null;
  video_url?: string | null;
}

// =====================================================
// 2. SEGMENTS
// =====================================================
export interface Segment {
  id: string;
  session_id: string;
  segment_number: number;
  start_time_seconds: number;
  end_time_seconds: number;
  duration_seconds: number;
  audio_url: string | null;
  transcription_status: "pending" | "processing" | "completed" | "failed";
  ai_summary: string | null;
  ai_action_type:
    | "song_search"
    | "image_search"
    | "image_generation"
    | "none"
    | null;
  ai_action_status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  processed_at: string | null;
}

export interface SegmentInsert {
  id?: string;
  session_id: string;
  segment_number: number;
  start_time_seconds: number;
  end_time_seconds: number;
  duration_seconds: number;
  audio_url?: string | null;
  transcription_status?: "pending" | "processing" | "completed" | "failed";
  ai_summary?: string | null;
  ai_action_type?:
    | "song_search"
    | "image_search"
    | "image_generation"
    | "none"
    | null;
  ai_action_status?: "pending" | "processing" | "completed" | "failed";
}

// =====================================================
// 3. TURNS
// =====================================================
export interface Turn {
  id: string;
  segment_id: string;
  session_id: string;
  speaker: "elderly" | "young_adult";
  speaker_id: string | null;
  transcript: string;
  start_time_seconds: number;
  end_time_seconds: number;
  confidence: number;
  turn_number: number;
  created_at: string;
}

export interface TurnInsert {
  id?: string;
  segment_id: string;
  session_id: string;
  speaker: "elderly" | "young_adult";
  speaker_id?: string | null;
  transcript: string;
  start_time_seconds: number;
  end_time_seconds: number;
  confidence?: number;
  turn_number: number;
}

// =====================================================
// 4. ACTIONS
// =====================================================
export interface Action {
  id: string;
  segment_id: string;
  session_id: string;
  action_type: "song_search" | "image_search" | "image_generation";
  priority: number;
  keywords: SongKeywords | ImageKeywords | null;
  status: "pending" | "processing" | "completed" | "failed";
  result_url: string | null;
  result_metadata: ActionResultMetadata | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ActionInsert {
  id?: string;
  segment_id: string;
  session_id: string;
  action_type: "song_search" | "image_search" | "image_generation";
  priority: number;
  keywords?: SongKeywords | ImageKeywords | null;
  status?: "pending" | "processing" | "completed" | "failed";
  result_url?: string | null;
  result_metadata?: ActionResultMetadata | null;
  error_message?: string | null;
}

// =====================================================
// 5. GENERATED CONTENT (Legacy)
// =====================================================
export interface GeneratedContent {
  id: string;
  session_id: string;
  segment_id: string | null;
  content_type: "image" | "video" | "song";
  url: string;
  prompt: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// =====================================================
// 6. HELPER TYPES
// =====================================================

// Keywords for song search
export interface SongKeywords {
  artist?: string;
  title?: string;
  year?: number;
  lyrics?: string;
  genre?: string;
}

// Keywords for image search/generation
export interface ImageKeywords {
  description: string;
  keywords: string[];
  location?: string;
  time_period?: string;
  people?: string[];
}

// Action result metadata
export type ActionResultMetadata =
  | SongMetadata
  | ImageMetadata
  | GeneratedImageMetadata;

export interface SongMetadata {
  type: "song";
  title: string;
  artist: string;
  album?: string;
  year?: number;
  duration_seconds?: number;
  spotify_url?: string;
  youtube_url?: string;
  preview_url?: string;
}

export interface ImageMetadata {
  type: "image";
  source: string; // 'singapore_archives' | 'unsplash' | etc.
  title?: string;
  description?: string;
  date?: string;
  photographer?: string;
  location?: string;
  archive_id?: string;
}

export interface GeneratedImageMetadata {
  type: "generated_image";
  prompt: string;
  model: string; // 'dall-e-3' | 'stable-diffusion' | etc.
  style?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

// =====================================================
// 7. COMPOSITE TYPES FOR UI
// =====================================================

// Full segment with all related data
export interface SegmentWithData extends Segment {
  turns: Turn[];
  actions: Action[];
}

// Session with all segments and data
export interface SessionWithData extends Session {
  segments: SegmentWithData[];
}

// Elderly response extraction helper
export interface ElderlyResponse {
  segment_number: number;
  transcript: string;
  confidence: number;
  timestamp: number;
}
