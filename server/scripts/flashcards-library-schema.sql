create extension if not exists pgcrypto;

create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null check (language in ('english', 'japanese')),
  icon text default '📘',
  description text,
  cover_image text,
  difficulty_rating integer check (difficulty_rating between 1 and 5),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flashcard_decks
  add column if not exists difficulty_rating integer check (difficulty_rating between 1 and 5);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  language text not null check (language in ('english', 'japanese')),
  front_word text not null,
  front_furigana text,
  back_meaning text not null,
  example text,
  example_translation text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flashcards_deck_id_idx
  on public.flashcards(deck_id);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now(),
  username text unique,
  full_name text,
  avatar_url text,
  goal bigint not null default 15
);

create table if not exists public.user_deck_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id text not null,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  current_index integer not null default 0,
  total_cards integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

create index if not exists user_deck_progress_user_id_idx
  on public.user_deck_progress(user_id);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
  ) then
    create policy "profiles_select_own"
      on public.profiles
      for select
      using (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_insert_own'
  ) then
    create policy "profiles_insert_own"
      on public.profiles
      for insert
      with check (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own"
      on public.profiles
      for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_read_public'
  ) then
    create policy "avatars_read_public"
      on storage.objects
      for select
      using (bucket_id = 'avatars');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_upload_own'
  ) then
    create policy "avatars_upload_own"
      on storage.objects
      for insert
      with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'avatars_update_own'
  ) then
    create policy "avatars_update_own"
      on storage.objects
      for update
      using (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      )
      with check (
        bucket_id = 'avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end
$$;
