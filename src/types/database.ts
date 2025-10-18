export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          user_id: string;
          rite_of_passage:
            | "birth-childhood"
            | "coming-of-age"
            | "marriage"
            | "death";
          created_at: string;
          status: "active" | "completed" | "archived";
          title?: string;
          summary?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rite_of_passage:
            | "birth-childhood"
            | "coming-of-age"
            | "marriage"
            | "death";
          created_at?: string;
          status?: "active" | "completed" | "archived";
          title?: string;
          summary?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rite_of_passage?:
            | "birth-childhood"
            | "coming-of-age"
            | "marriage"
            | "death";
          created_at?: string;
          status?: "active" | "completed" | "archived";
          title?: string;
          summary?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          session_id: string;
          speaker_role: "elderly" | "young_adult";
          transcript: string;
          audio_url?: string;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          speaker_role: "elderly" | "young_adult";
          transcript: string;
          audio_url?: string;
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          speaker_role?: "elderly" | "young_adult";
          transcript?: string;
          audio_url?: string;
          timestamp?: string;
          created_at?: string;
        };
      };
      generated_content: {
        Row: {
          id: string;
          session_id: string;
          content_type: "image" | "video";
          url: string;
          prompt: string;
          created_at: string;
          metadata?: any;
        };
        Insert: {
          id?: string;
          session_id: string;
          content_type: "image" | "video";
          url: string;
          prompt: string;
          created_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          session_id?: string;
          content_type?: "image" | "video";
          url?: string;
          prompt?: string;
          created_at?: string;
          metadata?: any;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
