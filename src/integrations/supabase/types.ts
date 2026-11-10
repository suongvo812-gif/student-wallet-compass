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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string | null
          created_at: string
          event: string
          feature: string | null
          id: string
          path: string | null
          session_id: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          event: string
          feature?: string | null
          id?: string
          path?: string | null
          session_id: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          action?: string | null
          created_at?: string
          event?: string
          feature?: string | null
          id?: string
          path?: string | null
          session_id?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          monthly_limit: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          bank: string
          color: string
          created_at: string
          credit_limit: number
          due_day: number | null
          expiry: string
          holder: string
          id: string
          last4: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bank?: string
          color?: string
          created_at?: string
          credit_limit?: number
          due_day?: number | null
          expiry?: string
          holder?: string
          id?: string
          last4: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          bank?: string
          color?: string
          created_at?: string
          credit_limit?: number
          due_day?: number | null
          expiry?: string
          holder?: string
          id?: string
          last4?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          kind: string
          params: Json
          title_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          params?: Json
          title_key: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          params?: Json
          title_key?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          currency: string
          full_name: string
          id: string
          language: string
          school: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          full_name?: string
          id: string
          language?: string
          school?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          full_name?: string
          id?: string
          language?: string
          school?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          card_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          occurred_on: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          card_id?: string | null
          category: string
          created_at?: string
          description?: string
          id?: string
          occurred_on?: string
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          card_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          occurred_on?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_fk"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
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
      admin_auth_events: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          email: string
          event: string
          occurred_at: string
        }[]
      }
      admin_daily: {
        Args: { p_from: string; p_to: string; p_tz?: string }
        Returns: {
          active_users: number
          avg_session_seconds: number
          day: string
          new_accounts: number
          page_views: number
          sign_ins: number
          sign_outs: number
          visitors: number
          visits: number
        }[]
      }
      admin_overview: { Args: { p_from: string; p_to: string }; Returns: Json }
      admin_users: {
        Args: { p_from: string; p_search?: string; p_to: string }
        Returns: {
          avg_session_seconds: number
          budget_count: number
          created_at: string
          email: string
          email_verified: boolean
          expense_records: number
          full_name: string
          income_records: number
          is_admin: boolean
          last_active: string
          last_sign_in_at: string
          page_views: number
          sign_ins: number
          total_session_seconds: number
          user_id: string
          visits: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
