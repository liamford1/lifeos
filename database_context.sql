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
  CONSTRAINT cooked_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT cooked_meals_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id)
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
  CONSTRAINT fitness_sports_pkey PRIMARY KEY (id),
  CONSTRAINT fitness_sports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
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
  CONSTRAINT food_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id),
  CONSTRAINT food_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
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
  CONSTRAINT meal_ingredients_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id),
  CONSTRAINT meal_ingredients_food_item_id_fkey FOREIGN KEY (food_item_id) REFERENCES public.food_items(id)
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
  CONSTRAINT planned_meals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT planned_meals_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES public.meals(id)
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