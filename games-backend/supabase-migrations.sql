-- Run this in your Supabase SQL editor

-- Dice rolls cache: one roll per match, prevents cherry-picking
create table if not exists dice_rolls (
  match_id   bigint primary key,
  roll       smallint not null check (roll >= 1 and roll <= 6),
  created_at timestamp with time zone default now()
);
