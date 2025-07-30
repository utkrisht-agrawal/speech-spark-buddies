export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string
          criteria: Json
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          points_reward: number | null
        }
        Insert: {
          created_at?: string
          criteria: Json
          description: string
          icon: string
          id?: string
          is_active?: boolean
          name: string
          points_reward?: number | null
        }
        Update: {
          created_at?: string
          criteria?: Json
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          points_reward?: number | null
        }
        Relationships: []
      }
      daily_activities: {
        Row: {
          activity_date: string
          created_at: string
          exercises_completed: number | null
          id: string
          phonemes_practiced: number | null
          sentences_practiced: number | null
          session_duration: number | null
          total_xp_earned: number | null
          updated_at: string
          user_id: string
          words_practiced: number | null
        }
        Insert: {
          activity_date?: string
          created_at?: string
          exercises_completed?: number | null
          id?: string
          phonemes_practiced?: number | null
          sentences_practiced?: number | null
          session_duration?: number | null
          total_xp_earned?: number | null
          updated_at?: string
          user_id: string
          words_practiced?: number | null
        }
        Update: {
          activity_date?: string
          created_at?: string
          exercises_completed?: number | null
          id?: string
          phonemes_practiced?: number | null
          sentences_practiced?: number | null
          session_duration?: number | null
          total_xp_earned?: number | null
          updated_at?: string
          user_id?: string
          words_practiced?: number | null
        }
        Relationships: []
      }
      exercise_assignments: {
        Row: {
          age_group: string | null
          assigned_by: string
          assigned_to: string | null
          assignment_type: string
          created_at: string
          exercise_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          target_level: number | null
        }
        Insert: {
          age_group?: string | null
          assigned_by: string
          assigned_to?: string | null
          assignment_type: string
          created_at?: string
          exercise_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          target_level?: number | null
        }
        Update: {
          age_group?: string | null
          assigned_by?: string
          assigned_to?: string | null
          assignment_type?: string
          created_at?: string
          exercise_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          target_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_assignments_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_progress: {
        Row: {
          attempts: number
          best_score: number
          created_at: string
          exercise_id: string
          id: string
          item_content: string
          item_index: number
          last_score: number
          level_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          best_score?: number
          created_at?: string
          exercise_id: string
          id?: string
          item_content: string
          item_index: number
          last_score?: number
          level_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_score?: number
          created_at?: string
          exercise_id?: string
          id?: string
          item_content?: string
          item_index?: number
          last_score?: number
          level_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          difficulty: number
          id: string
          instruction: string
          is_active: boolean
          points: number
          required_accuracy: number
          target_phonemes: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          created_by: string
          difficulty: number
          id?: string
          instruction: string
          is_active?: boolean
          points?: number
          required_accuracy?: number
          target_phonemes?: string[] | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          difficulty?: number
          id?: string
          instruction?: string
          is_active?: boolean
          points?: number
          required_accuracy?: number
          target_phonemes?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      level_config: {
        Row: {
          created_at: string
          id: string
          level_id: number
          pass_score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: number
          pass_score?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: number
          pass_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      level_progress: {
        Row: {
          average_score: number
          completed_exercises: number
          created_at: string
          id: string
          is_completed: boolean
          level_id: number
          pass_score: number
          total_exercises: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_score?: number
          completed_exercises?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          level_id: number
          pass_score?: number
          total_exercises?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_score?: number
          completed_exercises?: number
          created_at?: string
          id?: string
          is_completed?: boolean
          level_id?: number
          pass_score?: number
          total_exercises?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          assessment_completed: boolean | null
          created_at: string
          current_level: number | null
          full_name: string | null
          id: string
          last_active_date: string | null
          role: Database["public"]["Enums"]["user_role"]
          streak_days: number | null
          total_xp: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          assessment_completed?: boolean | null
          created_at?: string
          current_level?: number | null
          full_name?: string | null
          id?: string
          last_active_date?: string | null
          role: Database["public"]["Enums"]["user_role"]
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          assessment_completed?: boolean | null
          created_at?: string
          current_level?: number | null
          full_name?: string | null
          id?: string
          last_active_date?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      student_parent_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          id: string
          is_active: boolean
          parent_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          id?: string
          is_active?: boolean
          parent_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_therapist_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          id: string
          is_active: boolean
          student_id: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          id?: string
          is_active?: boolean
          student_id: string
          therapist_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          id?: string
          is_active?: boolean
          student_id?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          accuracy: number
          assignment_id: string | null
          completed_at: string
          exercise_id: string | null
          exercise_type: string
          id: string
          score: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          accuracy: number
          assignment_id?: string | null
          completed_at?: string
          exercise_id?: string | null
          exercise_type: string
          id?: string
          score: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          accuracy?: number
          assignment_id?: string | null
          completed_at?: string
          exercise_id?: string | null
          exercise_type?: string
          id?: string
          score?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "exercise_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_role: "child" | "parent" | "therapist" | "admin"
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
    Enums: {
      user_role: ["child", "parent", "therapist", "admin"],
    },
  },
} as const
