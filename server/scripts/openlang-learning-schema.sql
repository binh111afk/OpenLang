create extension if not exists pgcrypto;

-- Enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'language_code') THEN
    CREATE TYPE public.language_code AS ENUM ('english', 'japanese');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'srs_status') THEN
    CREATE TYPE public.srs_status AS ENUM ('new', 'learning', 'mastered');
  END IF;
END $$;

-- Users profile (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  goal integer not null default 15,
  total_xp bigint not null default 0,
  current_rank text not null default 'Bronze',
  total_words_mastered integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists total_xp bigint not null default 0,
  add column if not exists current_rank text not null default 'Bronze',
  add column if not exists total_words_mastered integer not null default 0,
  add column if not exists created_at timestamptz not null default now();

create index if not exists profiles_total_xp_idx on public.profiles(total_xp desc);
create index if not exists profiles_current_rank_idx on public.profiles(current_rank);

-- Vocabulary source table
create table if not exists public.vocabulary (
  id uuid primary key default gen_random_uuid(),
  language public.language_code not null,
  word text not null,
  meaning text not null,
  example_sentence text,
  audio_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vocabulary_language_word_unique unique (language, word)
);

alter table public.vocabulary
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists language public.language_code,
  add column if not exists meaning text,
  add column if not exists example_sentence text,
  add column if not exists audio_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

DO $$
BEGIN
  -- Backfill safe defaults for legacy rows.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'language'
  ) THEN
    UPDATE public.vocabulary
    SET language = 'english'
    WHERE language IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'meaning'
  ) THEN
    UPDATE public.vocabulary
    SET meaning = ''
    WHERE meaning IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.vocabulary
      ALTER COLUMN language SET DEFAULT 'english',
      ALTER COLUMN language SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'id'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS vocabulary_id_uidx ON public.vocabulary(id);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'meaning'
  ) THEN
    ALTER TABLE public.vocabulary
      ALTER COLUMN meaning SET DEFAULT '',
      ALTER COLUMN meaning SET NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'language'
  ) THEN
    CREATE INDEX IF NOT EXISTS vocabulary_language_idx ON public.vocabulary(language);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'word'
  ) THEN
    CREATE INDEX IF NOT EXISTS vocabulary_word_idx ON public.vocabulary(word);
  END IF;
END $$;

-- Per-user SRS state for each vocabulary item
create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vocabulary_id text not null,
  next_review timestamptz not null default now(),
  interval_days integer not null default 1 check (interval_days >= 0),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor >= 1.30 and ease_factor <= 3.00),
  status public.srs_status not null default 'new',
  last_reviewed_at timestamptz,
  review_count integer not null default 0 check (review_count >= 0),
  lapse_count integer not null default 0 check (lapse_count >= 0),
  correct_streak integer not null default 0 check (correct_streak >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_progress_user_vocab_unique unique (user_id, vocabulary_id)
);

create index if not exists user_progress_due_idx on public.user_progress(user_id, next_review);
create index if not exists user_progress_status_idx on public.user_progress(user_id, status);

DO $$
DECLARE
  v_vocab_id_type text;
  v_progress_id_type text;
BEGIN
  SELECT data_type
  INTO v_vocab_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'vocabulary' AND column_name = 'id';

  SELECT data_type
  INTO v_progress_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'user_progress' AND column_name = 'vocabulary_id';

  IF v_vocab_id_type = v_progress_id_type THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'user_progress_vocabulary_id_fkey'
        AND conrelid = 'public.user_progress'::regclass
    ) THEN
      ALTER TABLE public.user_progress
      ADD CONSTRAINT user_progress_vocabulary_id_fkey
      FOREIGN KEY (vocabulary_id) REFERENCES public.vocabulary(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Daily stats for streak and analytics
create table if not exists public.daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  xp_gained integer not null default 0 check (xp_gained >= 0),
  words_reviewed integer not null default 0 check (words_reviewed >= 0),
  words_mastered integer not null default 0 check (words_mastered >= 0),
  study_minutes integer not null default 0 check (study_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_stats_user_date_unique unique (user_id, study_date)
);

create index if not exists daily_stats_user_date_idx on public.daily_stats(user_id, study_date desc);
create index if not exists daily_stats_date_idx on public.daily_stats(study_date desc);

-- Weekly leaderboard snapshots
create table if not exists public.weekly_leaderboard (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  xp_total integer not null default 0 check (xp_total >= 0),
  rank_position integer not null check (rank_position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_leaderboard_unique_user_week unique (week_start, user_id),
  constraint weekly_leaderboard_unique_rank_week unique (week_start, rank_position),
  constraint weekly_leaderboard_week_valid check (week_end = week_start + 6)
);

create index if not exists weekly_leaderboard_week_rank_idx
  on public.weekly_leaderboard(week_start desc, rank_position asc);

create index if not exists weekly_leaderboard_user_week_idx
  on public.weekly_leaderboard(user_id, week_start desc);

-- Generic updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_profiles_updated_at') THEN
    CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vocabulary_updated_at') THEN
    CREATE TRIGGER trg_vocabulary_updated_at
    BEFORE UPDATE ON public.vocabulary
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_progress_updated_at') THEN
    CREATE TRIGGER trg_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_daily_stats_updated_at') THEN
    CREATE TRIGGER trg_daily_stats_updated_at
    BEFORE UPDATE ON public.daily_stats
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_weekly_leaderboard_updated_at') THEN
    CREATE TRIGGER trg_weekly_leaderboard_updated_at
    BEFORE UPDATE ON public.weekly_leaderboard
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- Rebuild leaderboard snapshot for a given week (week starts on Monday)
create or replace function public.refresh_weekly_leaderboard(p_week_start date)
returns void
language plpgsql
as $$
declare
  v_week_start date := date_trunc('week', p_week_start)::date;
  v_week_end date := (date_trunc('week', p_week_start)::date + 6);
begin
  delete from public.weekly_leaderboard
  where week_start = v_week_start;

  insert into public.weekly_leaderboard (
    week_start,
    week_end,
    user_id,
    xp_total,
    rank_position,
    created_at,
    updated_at
  )
  select
    v_week_start as week_start,
    v_week_end as week_end,
    x.user_id,
    x.xp_total,
    dense_rank() over (order by x.xp_total desc, x.user_id) as rank_position,
    now(),
    now()
  from (
    select
      ds.user_id,
      coalesce(sum(ds.xp_gained), 0)::integer as xp_total
    from public.daily_stats ds
    where ds.study_date between v_week_start and v_week_end
    group by ds.user_id
  ) x;
end;
$$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.vocabulary enable row level security;
alter table public.user_progress enable row level security;
alter table public.daily_stats enable row level security;
alter table public.weekly_leaderboard enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_own_v2'
  ) THEN
    CREATE POLICY profiles_select_own_v2
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_insert_own_v2'
  ) THEN
    CREATE POLICY profiles_insert_own_v2
      ON public.profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_update_own_v2'
  ) THEN
    CREATE POLICY profiles_update_own_v2
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'vocabulary'
      AND policyname = 'vocabulary_read_authenticated'
  ) THEN
    CREATE POLICY vocabulary_read_authenticated
      ON public.vocabulary
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_progress'
      AND policyname = 'user_progress_select_own'
  ) THEN
    CREATE POLICY user_progress_select_own
      ON public.user_progress
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_progress'
      AND policyname = 'user_progress_insert_own'
  ) THEN
    CREATE POLICY user_progress_insert_own
      ON public.user_progress
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_progress'
      AND policyname = 'user_progress_update_own'
  ) THEN
    CREATE POLICY user_progress_update_own
      ON public.user_progress
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_progress'
      AND policyname = 'user_progress_delete_own'
  ) THEN
    CREATE POLICY user_progress_delete_own
      ON public.user_progress
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_stats'
      AND policyname = 'daily_stats_select_own'
  ) THEN
    CREATE POLICY daily_stats_select_own
      ON public.daily_stats
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_stats'
      AND policyname = 'daily_stats_insert_own'
  ) THEN
    CREATE POLICY daily_stats_insert_own
      ON public.daily_stats
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'daily_stats'
      AND policyname = 'daily_stats_update_own'
  ) THEN
    CREATE POLICY daily_stats_update_own
      ON public.daily_stats
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'weekly_leaderboard'
      AND policyname = 'weekly_leaderboard_read_authenticated'
  ) THEN
    CREATE POLICY weekly_leaderboard_read_authenticated
      ON public.weekly_leaderboard
      FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;
