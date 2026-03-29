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
