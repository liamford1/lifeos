-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.calendar_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  source text,
  source_id uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id),
  CONSTRAINT calendar_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cooked_meals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meal_id uuid NOT NULL,
  cook_count integer DEFAULT 1,
  last_cooked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cooked_meals_pkey PRIMARY KEY (user_id, meal_id),
  CONSTRAINT cooked_meals_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT cooked_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.cooking_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meal_id uuid NOT NULL,
  in_progress boolean DEFAULT true,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  ended_at timestamp with time zone,
  current_step integer DEFAULT 0,
  CONSTRAINT cooking_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT cooking_sessions_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT cooking_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  category text,
  store text,
  payment_method text,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.fitness_cardio (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  activity_type text,
  date date NOT NULL,
  duration_minutes integer,
  distance_miles double precision,
  calories_burned double precision,
  location text,
  notes text,
  inserted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  status text DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['planned'::text, 'completed'::text])),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  in_progress boolean DEFAULT false,
  CONSTRAINT fitness_cardio_pkey PRIMARY KEY (id),
  CONSTRAINT fitness_cardio_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.fitness_exercises (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  workout_id uuid,
  name text NOT NULL,
  notes text,
  CONSTRAINT fitness_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT fitness_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.fitness_workouts(id)
);
CREATE TABLE public.fitness_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL,
  reps integer NOT NULL,
  weight numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fitness_sets_pkey PRIMARY KEY (id),
  CONSTRAINT fitness_sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.fitness_exercises(id)
);
CREATE TABLE public.fitness_sports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  activity_type text NOT NULL,
  date date NOT NULL,
  duration_minutes integer,
  intensity_level text,
  location text,
  weather text,
  participants text,
  score text,
  performance_notes text,
  injuries_or_flags text,
  calories_burned double precision,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  status text DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['planned'::text, 'completed'::text])),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  in_progress boolean DEFAULT false,
  CONSTRAINT fitness_sports_pkey PRIMARY KEY (id),
  CONSTRAINT fitness_sports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.fitness_stretching (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_type text NOT NULL,
  date date NOT NULL,
  duration_minutes integer,
  intensity_level text,
  body_parts text,
  notes text,
  inserted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  status text DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['planned'::text, 'completed'::text])),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  in_progress boolean DEFAULT false,
  CONSTRAINT fitness_stretching_pkey PRIMARY KEY (id),
  CONSTRAINT fitness_stretching_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.fitness_workouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text,
  date date NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['planned'::text, 'completed'::text])),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  in_progress boolean DEFAULT false,
  CONSTRAINT fitness_workouts_pkey PRIMARY KEY (id),
  CONSTRAINT fitness_workouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.food_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  quantity numeric,
  unit text,
  category text,
  added_from text DEFAULT 'manual'::text,
  expires_at date,
  added_at timestamp with time zone DEFAULT now(),
  receipt_id uuid,
  CONSTRAINT food_items_pkey PRIMARY KEY (id),
  CONSTRAINT food_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT food_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id)
);
CREATE TABLE public.meal_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  meal_id uuid,
  food_item_id uuid,
  food_item_name text NOT NULL,
  quantity numeric,
  unit text,
  name text,
  CONSTRAINT meal_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT meal_ingredients_food_item_id_fkey FOREIGN KEY (food_item_id) REFERENCES public.food_items(id),
  CONSTRAINT meal_ingredients_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id)
);
CREATE TABLE public.meals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  description text,
  servings integer,
  last_cooked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  ai_generated boolean DEFAULT false,
  notes text,
  prep_time integer,
  cook_time integer,
  instructions ARRAY,
  image_url text,
  tags ARRAY,
  difficulty text,
  calories integer,
  date date,
  CONSTRAINT meals_pkey PRIMARY KEY (id),
  CONSTRAINT meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.planned_meals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meal_id uuid,
  planned_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  meal_time text DEFAULT 'dinner'::text CHECK (meal_time = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text])),
  CONSTRAINT planned_meals_pkey PRIMARY KEY (id),
  CONSTRAINT planned_meals_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT planned_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  birthday date,
  gender text,
  location text,
  bio text,
  height_cm double precision,
  weight_kg double precision,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.receipt_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receipt_id uuid,
  food_item_id uuid,
  name text NOT NULL,
  quantity numeric,
  unit text,
  price numeric,
  matched_to_inventory boolean DEFAULT false,
  CONSTRAINT receipt_items_pkey PRIMARY KEY (id),
  CONSTRAINT receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id),
  CONSTRAINT receipt_items_food_item_id_fkey FOREIGN KEY (food_item_id) REFERENCES public.food_items(id)
);
CREATE TABLE public.receipts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  store_name text,
  scanned_at timestamp with time zone DEFAULT now(),
  raw_text text,
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.scratchpad_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scratchpad_entries_pkey PRIMARY KEY (id),
  CONSTRAINT scratchpad_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Food Items
CREATE POLICY "Delete own food_items" ON public.food_items FOR DELETE TO public USING (auth.uid() = user_id);
CREATE POLICY "Insert own food_items" ON public.food_items FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Select own food_items" ON public.food_items FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Update own food_items" ON public.food_items FOR UPDATE TO public USING (auth.uid() = user_id);

-- Receipts
CREATE POLICY "Delete own receipts" ON public.receipts FOR DELETE TO public USING (auth.uid() = user_id);
CREATE POLICY "Insert own receipts" ON public.receipts FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Select own receipts" ON public.receipts FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Update own receipts" ON public.receipts FOR UPDATE TO public USING (auth.uid() = user_id);

-- Receipt Items
CREATE POLICY "Insert receipt_items if parent receipt is user's" ON public.receipt_items FOR INSERT TO public WITH CHECK (auth.uid() = (SELECT receipts.user_id FROM receipts WHERE receipts.id = receipt_items.receipt_id));
CREATE POLICY "Select receipt_items by receipt's user" ON public.receipt_items FOR SELECT TO public USING (auth.uid() = (SELECT receipts.user_id FROM receipts WHERE receipts.id = receipt_items.receipt_id));

-- Meals
CREATE POLICY "Delete own meals" ON public.meals FOR DELETE TO public USING (auth.uid() = user_id);
CREATE POLICY "Insert own meals" ON public.meals FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Select own meals" ON public.meals FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Update own meals" ON public.meals FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meals" ON public.meals FOR INSERT TO public WITH CHECK (user_id = auth.uid());

-- Meal Ingredients
CREATE POLICY "Insert meal_ingredients if parent meal is user's" ON public.meal_ingredients FOR INSERT TO public WITH CHECK (auth.uid() = (SELECT meals.user_id FROM meals WHERE meals.id = meal_ingredients.meal_id));
CREATE POLICY "Select meal_ingredients by meal's user" ON public.meal_ingredients FOR SELECT TO public USING (auth.uid() = (SELECT meals.user_id FROM meals WHERE meals.id = meal_ingredients.meal_id));
CREATE POLICY "Users can update their own meal ingredients" ON public.meal_ingredients FOR UPDATE TO public USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_ingredients.meal_id AND meals.user_id = auth.uid()));
CREATE POLICY "Users can delete their own meal ingredients" ON public.meal_ingredients FOR DELETE TO public USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_ingredients.meal_id AND meals.user_id = auth.uid()));

-- Cooked Meals
CREATE POLICY "Users can insert their own logs" ON public.cooked_meals FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cooked_meals" ON public.cooked_meals FOR UPDATE TO public USING (user_id = auth.uid());
CREATE POLICY "Users can view their own logs" ON public.cooked_meals FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cooked_meals" ON public.cooked_meals FOR DELETE TO public USING (auth.uid() = user_id);

-- Planned Meals
CREATE POLICY "Users can access their own planned meals" ON public.planned_meals FOR ALL TO public USING (auth.uid() = user_id);

-- Scratchpad Entries
CREATE POLICY "Users can access their own scratchpad entries" ON public.scratchpad_entries FOR ALL TO public USING (auth.uid() = user_id);

-- Expenses
CREATE POLICY "Users can manage their own expenses" ON public.expenses FOR ALL TO public USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Fitness Workouts
CREATE POLICY "Users can access their workouts" ON public.fitness_workouts FOR ALL TO public USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Fitness Exercises
CREATE POLICY "User can access their own exercises via workout" ON public.fitness_exercises FOR ALL TO public USING (EXISTS (SELECT 1 FROM fitness_workouts WHERE fitness_workouts.id = fitness_exercises.workout_id AND fitness_workouts.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM fitness_workouts WHERE fitness_workouts.id = fitness_exercises.workout_id AND fitness_workouts.user_id = auth.uid()));

-- Fitness Cardio
CREATE POLICY "User can access their own cardio sessions" ON public.fitness_cardio FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fitness Sports
CREATE POLICY "User can access their own sports logs" ON public.fitness_sports FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fitness Stretching
CREATE POLICY "User can access their own stretching sessions" ON public.fitness_stretching FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Profiles
CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Calendar Events
CREATE POLICY "Users can access their own calendar events" ON public.calendar_events FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert their own calendar events" ON public.calendar_events FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own calendar events" ON public.calendar_events FOR SELECT TO public USING (auth.uid() = user_id);

-- Fitness Sets
CREATE POLICY "Full access to owned sets" ON public.fitness_sets FOR ALL TO public USING (EXISTS (SELECT 1 FROM fitness_exercises fe JOIN fitness_workouts fw ON fe.workout_id = fw.id WHERE fe.id = fitness_sets.exercise_id AND fw.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM fitness_exercises fe JOIN fitness_workouts fw ON fe.workout_id = fw.id WHERE fe.id = fitness_sets.exercise_id AND fw.user_id = auth.uid()));

-- Policy: Users can access their own cooking sessions
CREATE POLICY "Users can access their own cooking sessions" ON public.cooking_sessions FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
