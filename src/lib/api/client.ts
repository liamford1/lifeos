import { supabase } from '../supabaseClient';
import type { 
  Meal, MealInsert, MealUpdate,
  PantryItem, PantryItemInsert, PantryItemUpdate,
  Workout, WorkoutInsert, WorkoutUpdate,
  WorkoutSession, WorkoutSessionInsert, WorkoutSessionUpdate,
  CardioSession, CardioSessionInsert, CardioSessionUpdate,
  SportsSession, SportsSessionInsert, SportsSessionUpdate,
  StretchingSession, StretchingSessionInsert, StretchingSessionUpdate,
  Expense, ExpenseInsert, ExpenseUpdate,
  Receipt, ReceiptInsert, ReceiptUpdate,
  ScratchpadNote, ScratchpadNoteInsert, ScratchpadNoteUpdate,
  Profile, ProfileUpdate
} from '@/types/supabase';

// Generic CRUD operations
export class ApiClient {
  // Meals
  static async getMeals(userId: string): Promise<Meal[]> {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getMeal(id: string, userId: string): Promise<Meal | null> {
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createMeal(meal: MealInsert): Promise<Meal> {
    const { data, error } = await supabase
      .from('meals')
      .insert(meal)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateMeal(id: string, updates: MealUpdate): Promise<Meal> {
    const { data, error } = await supabase
      .from('meals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteMeal(id: string): Promise<void> {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Pantry Items
  static async getPantryItems(userId: string): Promise<PantryItem[]> {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createPantryItem(item: PantryItemInsert): Promise<PantryItem> {
    const { data, error } = await supabase
      .from('pantry_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePantryItem(id: string, updates: PantryItemUpdate): Promise<PantryItem> {
    const { data, error } = await supabase
      .from('pantry_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deletePantryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Workouts
  static async getWorkouts(userId: string): Promise<Workout[]> {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createWorkout(workout: WorkoutInsert): Promise<Workout> {
    const { data, error } = await supabase
      .from('workouts')
      .insert(workout)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateWorkout(id: string, updates: WorkoutUpdate): Promise<Workout> {
    const { data, error } = await supabase
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteWorkout(id: string): Promise<void> {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Workout Sessions
  static async getWorkoutSessions(userId: string): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createWorkoutSession(session: WorkoutSessionInsert): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateWorkoutSession(id: string, updates: WorkoutSessionUpdate): Promise<WorkoutSession> {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Cardio Sessions
  static async getCardioSessions(userId: string): Promise<CardioSession[]> {
    const { data, error } = await supabase
      .from('cardio_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createCardioSession(session: CardioSessionInsert): Promise<CardioSession> {
    const { data, error } = await supabase
      .from('cardio_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCardioSession(id: string, updates: CardioSessionUpdate): Promise<CardioSession> {
    const { data, error } = await supabase
      .from('cardio_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Sports Sessions
  static async getSportsSessions(userId: string): Promise<SportsSession[]> {
    const { data, error } = await supabase
      .from('sports_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createSportsSession(session: SportsSessionInsert): Promise<SportsSession> {
    const { data, error } = await supabase
      .from('sports_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateSportsSession(id: string, updates: SportsSessionUpdate): Promise<SportsSession> {
    const { data, error } = await supabase
      .from('sports_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Stretching Sessions
  static async getStretchingSessions(userId: string): Promise<StretchingSession[]> {
    const { data, error } = await supabase
      .from('stretching_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createStretchingSession(session: StretchingSessionInsert): Promise<StretchingSession> {
    const { data, error } = await supabase
      .from('stretching_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateStretchingSession(id: string, updates: StretchingSessionUpdate): Promise<StretchingSession> {
    const { data, error } = await supabase
      .from('stretching_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Expenses
  static async getExpenses(userId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createExpense(expense: ExpenseInsert): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateExpense(id: string, updates: ExpenseUpdate): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Receipts
  static async getReceipts(userId: string): Promise<Receipt[]> {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async createReceipt(receipt: ReceiptInsert): Promise<Receipt> {
    const { data, error } = await supabase
      .from('receipts')
      .insert(receipt)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateReceipt(id: string, updates: ReceiptUpdate): Promise<Receipt> {
    const { data, error } = await supabase
      .from('receipts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteReceipt(id: string): Promise<void> {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Scratchpad Notes
  static async getScratchpadNotes(userId: string): Promise<ScratchpadNote[]> {
    const { data, error } = await supabase
      .from('scratchpad_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async getScratchpadNote(id: string): Promise<ScratchpadNote | null> {
    const { data, error } = await supabase
      .from('scratchpad_notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createScratchpadNote(note: ScratchpadNoteInsert): Promise<ScratchpadNote> {
    const { data, error } = await supabase
      .from('scratchpad_notes')
      .insert(note)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateScratchpadNote(id: string, updates: ScratchpadNoteUpdate): Promise<ScratchpadNote> {
    const { data, error } = await supabase
      .from('scratchpad_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteScratchpadNote(id: string): Promise<void> {
    const { error } = await supabase
      .from('scratchpad_notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Profile
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
