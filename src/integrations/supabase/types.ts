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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_characters: {
        Row: {
          accent_color: string
          avatar_emoji: string
          created_at: string
          description: string
          greeting: string
          id: string
          is_active: boolean
          name: string
          personality: string
          title: string
          updated_at: string
          voice_style: string
        }
        Insert: {
          accent_color?: string
          avatar_emoji?: string
          created_at?: string
          description: string
          greeting: string
          id?: string
          is_active?: boolean
          name: string
          personality: string
          title: string
          updated_at?: string
          voice_style?: string
        }
        Update: {
          accent_color?: string
          avatar_emoji?: string
          created_at?: string
          description?: string
          greeting?: string
          id?: string
          is_active?: boolean
          name?: string
          personality?: string
          title?: string
          updated_at?: string
          voice_style?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          character_id: string
          completed_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["interview_status"]
          student_id: string
        }
        Insert: {
          character_id: string
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["interview_status"]
          student_id: string
        }
        Update: {
          character_id?: string
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["interview_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "ai_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          program: string | null
          school: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          program?: string | null
          school?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          program?: string | null
          school?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          character_id: string | null
          created_at: string
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          expected_keywords: string[] | null
          id: string
          is_active: boolean
          question_text: string
        }
        Insert: {
          category?: string
          character_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          expected_keywords?: string[] | null
          id?: string
          is_active?: boolean
          question_text: string
        }
        Update: {
          category?: string
          character_id?: string | null
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          expected_keywords?: string[] | null
          id?: string
          is_active?: boolean
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "ai_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          interview_id: string
          question_id: string
          question_order: number
          question_text: string
          score: number | null
          transcript: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          interview_id: string
          question_id: string
          question_order?: number
          question_text: string
          score?: number | null
          transcript: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          interview_id?: string
          question_id?: string
          question_order?: number
          question_text?: string
          score?: number | null
          transcript?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          created_at: string
          final_score: number
          id: string
          improvements: string | null
          interview_id: string
          overall_feedback: string | null
          passed: boolean
          strengths: string | null
          student_id: string
          threshold: number
          weaknesses: string | null
        }
        Insert: {
          created_at?: string
          final_score: number
          id?: string
          improvements?: string | null
          interview_id: string
          overall_feedback?: string | null
          passed: boolean
          strengths?: string | null
          student_id: string
          threshold?: number
          weaknesses?: string | null
        }
        Update: {
          created_at?: string
          final_score?: number
          id?: string
          improvements?: string | null
          interview_id?: string
          overall_feedback?: string | null
          passed?: boolean
          strengths?: string | null
          student_id?: string
          threshold?: number
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "results_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: true
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student"
      approval_status: "pending" | "approved" | "rejected"
      interview_status: "in_progress" | "completed" | "abandoned"
      question_difficulty: "easy" | "medium" | "hard"
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
      app_role: ["admin", "student"],
      approval_status: ["pending", "approved", "rejected"],
      interview_status: ["in_progress", "completed", "abandoned"],
      question_difficulty: ["easy", "medium", "hard"],
    },
  },
} as const
