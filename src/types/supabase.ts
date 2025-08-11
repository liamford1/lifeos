export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meals: {
        Row: {
          id: string
          name: string
          description: string | null
          ingredients: Json
          instructions: Json
          prep_time: number | null
          cook_time: number | null
          servings: number | null
          difficulty: string | null
          cuisine: string | null
          tags: string[] | null
          image_url: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          ingredients: Json
          instructions: Json
          prep_time?: number | null
          cook_time?: number | null
          servings?: number | null
          difficulty?: string | null
          cuisine?: string | null
          tags?: string[] | null
          image_url?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          ingredients?: Json
          instructions?: Json
          prep_time?: number | null
          cook_time?: number | null
          servings?: number | null
          difficulty?: string | null
          cuisine?: string | null
          tags?: string[] | null
          image_url?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      pantry_items: {
        Row: {
          id: string
          name: string
          quantity: number
          unit: string
          category: string | null
          expiry_date: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          quantity: number
          unit: string
          category?: string | null
          expiry_date?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          quantity?: number
          unit?: string
          category?: string | null
          expiry_date?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          name: string
          description: string | null
          exercises: Json
          duration: number | null
          difficulty: string | null
          category: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          exercises: Json
          duration?: number | null
          difficulty?: string | null
          category?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          exercises?: Json
          duration?: number | null
          difficulty?: string | null
          category?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          workout_id: string
          user_id: string
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          user_id: string
          started_at: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          user_id?: string
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      cardio_sessions: {
        Row: {
          id: string
          activity_type: string
          duration: number
          distance: number | null
          calories_burned: number | null
          user_id: string
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          activity_type: string
          duration: number
          distance?: number | null
          calories_burned?: number | null
          user_id: string
          started_at: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          activity_type?: string
          duration?: number
          distance?: number | null
          calories_burned?: number | null
          user_id?: string
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      sports_sessions: {
        Row: {
          id: string
          sport_type: string
          duration: number
          intensity: string | null
          user_id: string
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sport_type: string
          duration: number
          intensity?: string | null
          user_id: string
          started_at: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sport_type?: string
          duration?: number
          intensity?: string | null
          user_id?: string
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      stretching_sessions: {
        Row: {
          id: string
          duration: number
          focus_areas: string[] | null
          user_id: string
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          duration: number
          focus_areas?: string[] | null
          user_id: string
          started_at: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          duration?: number
          focus_areas?: string[] | null
          user_id?: string
          started_at?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          description: string
          category: string
          date: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          amount: number
          description: string
          category: string
          date: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          amount?: number
          description?: string
          category?: string
          date?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          amount: number
          description: string
          category: string
          image_url: string | null
          date: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          amount: number
          description: string
          category: string
          image_url?: string | null
          date: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          amount?: number
          description?: string
          category?: string
          image_url?: string | null
          date?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      scratchpad_notes: {
        Row: {
          id: string
          title: string
          content: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type helpers for better developer experience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types for convenience
export type Profile = Tables<'profiles'>
export type Meal = Tables<'meals'>
export type PantryItem = Tables<'pantry_items'>
export type Workout = Tables<'workouts'>
export type WorkoutSession = Tables<'workout_sessions'>
export type CardioSession = Tables<'cardio_sessions'>
export type SportsSession = Tables<'sports_sessions'>
export type StretchingSession = Tables<'stretching_sessions'>
export type Expense = Tables<'expenses'>
export type Receipt = Tables<'receipts'>
export type ScratchpadNote = Tables<'scratchpad_notes'>

// Insert types
export type ProfileInsert = Inserts<'profiles'>
export type MealInsert = Inserts<'meals'>
export type PantryItemInsert = Inserts<'pantry_items'>
export type WorkoutInsert = Inserts<'workouts'>
export type WorkoutSessionInsert = Inserts<'workout_sessions'>
export type CardioSessionInsert = Inserts<'cardio_sessions'>
export type SportsSessionInsert = Inserts<'sports_sessions'>
export type StretchingSessionInsert = Inserts<'stretching_sessions'>
export type ExpenseInsert = Inserts<'expenses'>
export type ReceiptInsert = Inserts<'receipts'>
export type ScratchpadNoteInsert = Inserts<'scratchpad_notes'>

// Update types
export type ProfileUpdate = Updates<'profiles'>
export type MealUpdate = Updates<'meals'>
export type PantryItemUpdate = Updates<'pantry_items'>
export type WorkoutUpdate = Updates<'workouts'>
export type WorkoutSessionUpdate = Updates<'workout_sessions'>
export type CardioSessionUpdate = Updates<'cardio_sessions'>
export type SportsSessionUpdate = Updates<'sports_sessions'>
export type StretchingSessionUpdate = Updates<'stretching_sessions'>
export type ExpenseUpdate = Updates<'expenses'>
export type ReceiptUpdate = Updates<'receipts'>
export type ScratchpadNoteUpdate = Updates<'scratchpad_notes'>
