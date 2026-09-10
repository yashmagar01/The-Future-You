export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      events_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          clarity_score: number | null
          confidence_score: number | null
          created_at: string | null
          energy_score: number | null
          filler_words_count: number | null
          id: string
          improvements: string[] | null
          key_insights: Json | null
          overall_score: number | null
          pace_score: number | null
          recording_id: string
          strengths: string[] | null
          structure_score: number | null
          stutter_count: number | null
          tone_score: number | null
        }
        Insert: {
          clarity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          energy_score?: number | null
          filler_words_count?: number | null
          id?: string
          improvements?: string[] | null
          key_insights?: Json | null
          overall_score?: number | null
          pace_score?: number | null
          recording_id: string
          strengths?: string[] | null
          structure_score?: number | null
          stutter_count?: number | null
          tone_score?: number | null
        }
        Update: {
          clarity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          energy_score?: number | null
          filler_words_count?: number | null
          id?: string
          improvements?: string[] | null
          key_insights?: Json | null
          overall_score?: number | null
          pace_score?: number | null
          recording_id?: string
          strengths?: string[] | null
          structure_score?: number | null
          stutter_count?: number | null
          tone_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          anchors: string[] | null
          avatar_url: string | null
          betaconsent: boolean | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          goals: string[] | null
          id: string
          onboarding_data: Json | null
          priority: number | null
          role: string
          updated_at: string | null
        }
        Insert: {
          anchors?: string[] | null
          avatar_url?: string | null
          betaconsent?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          goals?: string[] | null
          id: string
          onboarding_data?: Json | null
          priority?: number | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          anchors?: string[] | null
          avatar_url?: string | null
          betaconsent?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          goals?: string[] | null
          id?: string
          onboarding_data?: Json | null
          priority?: number | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      habits: {
        Row: {
          archived: boolean | null
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          frequency: string | null
          icon: string | null
          id: string
          name: string
          target_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          archived?: boolean | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          name: string
          target_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          archived?: boolean | null
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          frequency?: string | null
          icon?: string | null
          id?: string
          name?: string
          target_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      habit_logs: {
        Row: {
          completed: boolean | null
          created_at: string | null
          habit_id: string
          id: string
          logged_date: string
          note: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          habit_id: string
          id?: string
          logged_date?: string
          note?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          habit_id?: string
          id?: string
          logged_date?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      companion_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reflections_memories: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      progress: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          recorded_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          recorded_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          recorded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          promoted_to: string
          waitlist_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          promoted_to: string
          waitlist_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          promoted_to?: string
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlist_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          text: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          text: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      recordings: {
        Row: {
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          notified: boolean
          status: string | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          notified?: boolean
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          notified?: boolean
          status?: string | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          created_at: string | null
          id: string
          recording_id: string | null
          segments: Json | null
          text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recording_id?: string | null
          segments?: Json | null
          text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recording_id?: string | null
          segments?: Json | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          confirm_token: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string | null
          phone: string | null
          referrer: string | null
          role_interest: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          confirm_token?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          referrer?: string | null
          role_interest: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          confirm_token?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          referrer?: string | null
          role_interest?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_id: { Args: never; Returns: string }
      get_current_user_id: { Args: never; Returns: string }
      send_pending_notifications: {
        Args: never
        Returns: {
          recording_id: string
          status: string
          user_email: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
